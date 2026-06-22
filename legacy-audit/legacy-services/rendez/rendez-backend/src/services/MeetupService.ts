import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { ReferralService } from './ReferralService';
import { redis } from '../config/redis';
import * as rezMerchant from '../integrations/rez/rezMerchantClient';
import { rewardTriggerQueue } from '../jobs/queue';

const referral = new ReferralService();

export class MeetupService {
  async suggestMerchants(profileId: string, matchId: string) {
    const profile = await prisma.profile.findUnique({ where: { id: profileId }, select: { lat: true, lng: true, city: true } });
    if (!profile?.lat || !profile?.lng) throw new AppError(400, 'Location not set — update your city/location in profile');
    return rezMerchant.getNearbyMerchants({ lat: profile.lat, lng: profile.lng });
  }

  async getNearbyMerchants(lat: number, lng: number) {
    return rezMerchant.getNearbyMerchants({ lat, lng });
  }

  async createBooking(params: {
    profileId: string;
    matchId: string;
    merchantId: string;
    date: string;
    partySize: number;
  }) {
    const match = await prisma.match.findFirst({
      where: { id: params.matchId, OR: [{ user1Id: params.profileId }, { user2Id: params.profileId }], status: 'ACTIVE' },
      include: {
        user1: { select: { rezUserId: true } },
        user2: { select: { rezUserId: true } },
      },
    });
    if (!match) throw new AppError(404, 'Match not found');

    const booking = await rezMerchant.createBooking({
      merchant_id: params.merchantId,
      user1_rez_id: match.user1.rezUserId,
      user2_rez_id: match.user2.rezUserId,
      date: params.date,
      party_size: params.partySize,
    });

    // Cache booking → match mapping for fast checkin lookup
    await redis.setex(`booking:${booking.booking_id}`, 48 * 3600, params.matchId);

    return booking;
  }

  async checkin(params: { profileId: string; matchId: string; bookingId: string; merchantId: string }) {
    const match = await prisma.match.findFirst({
      where: { id: params.matchId, OR: [{ user1Id: params.profileId }, { user2Id: params.profileId }] },
      include: {
        user1: { select: { id: true } },
        user2: { select: { id: true } },
      },
    });
    if (!match) throw new AppError(404, 'Match not found');

    const bookingMatchId = await redis.get(`booking:${params.bookingId}`);
    if (!bookingMatchId || bookingMatchId !== params.matchId) {
      throw new AppError(400, 'Booking does not belong to this match');
    }

    const existing = await prisma.meetupCheckin.findUnique({
      where: { matchId_userId: { matchId: params.matchId, userId: params.profileId } },
    });
    if (existing) return { validated: false, alreadyCheckedIn: true, message: 'You already checked in — waiting for your match' };

    await prisma.meetupCheckin.create({
      data: {
        matchId: params.matchId,
        bookingId: params.bookingId,
        rezMerchantId: params.merchantId,
        userId: params.profileId,
      },
    });

    const checkins = await prisma.meetupCheckin.findMany({
      where: { matchId: params.matchId, bookingId: params.bookingId },
    });
    const bothPresent = checkins.length >= 2;

    if (bothPresent) {
      // Sort by checkedInAt to ensure deterministic timeDiff regardless of DB return order
      const sorted = checkins.slice().sort((a, b) => a.checkedInAt.getTime() - b.checkedInAt.getTime());
      const timeDiff = sorted[1].checkedInAt.getTime() - sorted[0].checkedInAt.getTime();
      if (timeDiff > 30 * 60 * 1000) throw new AppError(400, 'Check-in window expired (30 min) — both must scan within 30 minutes');

      // RZ-B-H3 FIX: Use BullMQ job queue for reward trigger instead of fire-and-forget.
      // RZ-B-H4 FIX: Increase lock TTL from 5 min to 30 min to handle slow network operations
      // during the reward trigger process (multiple DB ops + external API calls).
      const lockKey = `reward_lock:${params.matchId}:${params.bookingId}`;
      const LOCK_TTL_SECONDS = 1800; // 30 minutes
      const acquired = await redis.set(lockKey, '1', 'EX', LOCK_TTL_SECONDS, 'NX');
      if (acquired === 'OK') {
        // Queue the reward trigger with built-in retries (3 attempts, exponential backoff).
        // This replaces the fire-and-forget .catch() pattern that silently swallowed errors.
        await rewardTriggerQueue.add('trigger-meetup-reward', {
          matchId: params.matchId,
          bookingId: params.bookingId,
          user1Id: match.user1Id,
          user2Id: match.user2Id,
        }, {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: true,
          removeOnFail: false,
        });
      }

      return { validated: true, bothCheckedIn: true, message: 'Meetup validated! Reward coins incoming 🎉' };
    }

    return { validated: false, bothCheckedIn: false, message: 'Checked in! Waiting for your match to scan their QR' };
  }

  async getMeetupStatus(profileId: string, matchId: string) {
    const match = await prisma.match.findFirst({
      where: { id: matchId, OR: [{ user1Id: profileId }, { user2Id: profileId }] },
    });
    if (!match) throw new AppError(404, 'Match not found');

    const checkins = await prisma.meetupCheckin.findMany({ where: { matchId } });
    const rewardRecord = await prisma.reward.findFirst({ where: { matchId } });

    const myCheckin = checkins.find((c) => c.userId === profileId);
    const partnerCheckin = checkins.find((c) => c.userId !== profileId);

    return {
      myCheckedIn: !!myCheckin,
      partnerCheckedIn: !!partnerCheckin,
      bothCheckedIn: checkins.length >= 2,
      validated: checkins.length >= 2,
      reward: rewardRecord
        ? { status: rewardRecord.status, triggeredAt: rewardRecord.triggeredAt }
        : null,
    };
  }
}
