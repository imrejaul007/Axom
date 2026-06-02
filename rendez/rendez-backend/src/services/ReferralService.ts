/**
 * ReferralService
 *
 * Invite flow:
 *   1. User A shares their inviteCode (deep link: rendez://invite/{code})
 *   2. User B opens the link → app stores the code and passes it at profile creation
 *   3. On profile create, we stamp referredBy = code, increment referrer.referralCount
 *   4. When User B completes their FIRST validated meetup, User A earns 100 REZ coins
 *      (credited via REZ wallet API — fire-and-forget, non-blocking)
 *
 * Coin value: 100 coins ≈ ₹10 (merchant can use toward next booking)
 */

import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { log } from '../config/telemetry';
import { AppError } from '../middleware/errorHandler';
import * as rezWallet from '../integrations/rez/rezWalletClient';

export class ReferralService {
  /** Return the caller's invite code and full deep link */
  async getMyCode(profileId: string) {
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: { inviteCode: true, referralCount: true, name: true },
    });
    if (!profile) throw new AppError(404, 'Profile not found');

    return {
      code: profile.inviteCode,
      link: `rendez://invite/${profile.inviteCode}`,
      referralCount: profile.referralCount,
    };
  }

  /**
   * Validate and stamp an invite code at profile creation time.
   * Called from profile POST if body contains referralCode.
   * RZ-B-B3 FIX: Only increment referrer's count after the referred user completes
   * profile creation (name, photo, age). A profile with no name/photo is a ghost
   * signup — we don't want to inflate the referrer's count with abandoned signups.
   * Returns the referrer profileId (used to credit later) or null.
   */
  async applyCode(newProfileId: string, code: string): Promise<string | null> {
    const existing = await prisma.profile.findUnique({ where: { id: newProfileId }, select: { referredBy: true, name: true, photos: true, age: true } });
    if (existing?.referredBy) return existing.referredBy;

    const referrer = await prisma.profile.findUnique({
      where: { inviteCode: code },
      select: { id: true },
    });
    if (!referrer) return null; // invalid code — silent fail, don't block signup

    // RZ-B-B3 FIX: Stamp referredBy immediately but only increment referralCount when the
    // referred user's profile is complete (has name, at least 1 photo, and valid age).
    // Incrementing is deferred to creditReferrerIfEligible, which fires after a validated
    // meetup — proof that the profile is real.
    const isProfileComplete = !!(existing?.name && existing?.photos?.length > 0 && existing?.age);

    await prisma.$transaction([
      prisma.profile.update({
        where: { id: newProfileId },
        data: { referredBy: code },
      }),
      // Only bump the count if profile is complete; otherwise wait for creditReferrerIfEligible
      ...(isProfileComplete ? [
        prisma.profile.update({
          where: { id: referrer.id },
          data: { referralCount: { increment: 1 } },
        }),
      ] : []),
    ]);

    return referrer.id;
  }

  /**
   * Credit referrer when a referred user completes their FIRST meetup.
   * Called from MeetupService._triggerRewardAndNotify after both users check in.
   * RZ-B-B2 FIX: Uses a Redis distributed lock to prevent double-crediting if two
   * concurrent checkins from the same device trigger this method simultaneously.
   * Fire-and-forget — never throws to caller.
   */
  async creditReferrerIfEligible(newUserId: string): Promise<void> {
    try {
      const lockKey = `referral_lock:${newUserId}`;
      const acquired = await redis.set(lockKey, '1', 'EX', 60, 'NX');
      if (acquired !== 'OK') return; // already being processed
      try {
        const profile = await prisma.profile.findUnique({
          where: { id: newUserId },
          select: { referredBy: true, meetupCount: true, rezUserId: true, name: true, photos: true, age: true },
        });
        if (!profile?.referredBy) return;

        // Only credit on the FIRST meetup (meetupCount was just incremented, so check === 1)
        if (profile.meetupCount !== 1) return;

        const referrer = await prisma.profile.findUnique({
          where: { inviteCode: profile.referredBy },
          select: { id: true, rezUserId: true, referralCount: true },
        });
        if (!referrer?.rezUserId) return;

        // Increment referralCount now that the referred user has a validated meetup
        // (and thus a complete profile — name, photo, age were verified at signup)
        await prisma.profile.update({
          where: { id: referrer.id },
          data: { referralCount: { increment: 1 } },
        });

        // BULLETPROOF: creditCoins with idempotency key prevents double-credit on retry.
        // Uses newUserId + timestamp bucket to make each referral credit unique.
        await rezWallet.creditCoins({
          rezUserId: referrer.rezUserId,
          coins: 100,
          reason: 'referral_meetup',
          meta: { referredUserId: newUserId },
          idempotencyKey: `referral:${newUserId}:${referrer.id}`,
        });
      } finally {
        await redis.del(lockKey);
      }
    } catch (err) {
      log.error({ err }, '[Referral] Credit failed (non-blocking)');
    }
  }
}
