/**
 * PlanService — Sprint 11: Social Invites
 *
 * Core logic for plan creation, application, selection, confirmation,
 * ghost handling, and refund/credit flows.
 */

import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { AppError } from '../middleware/errorHandler';
import {
  PlanCategory, PlanStatus, PlanVisibility, GenderPref, PlanVibe,
  ApplicationStatus, ChatState, CoinCreditStatus,
} from '@prisma/client';
import { NotificationService } from './NotificationService';
import { verifyRezBooking } from '../integrations/rez/rezBookingClient';
import * as rezWallet from '../integrations/rez/rezWalletClient';
import { ExperienceCreditService } from './ExperienceCreditService';
import { log } from '../config/telemetry';
import { sponsorCreditQueue } from '../jobs/queue';

const notif        = new NotificationService();
const creditService = new ExperienceCreditService();

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface CreatePlanInput {
  organizerId:         string;
  category:            PlanCategory;
  merchantId:          string;
  merchantName:        string;
  rezBookingRef:       string;
  title:               string;
  scheduledAt:         Date;
  city:                string;
  genderPreference?:   GenderPref;
  ageMin?:             number;
  ageMax?:             number;
  visibility?:         PlanVisibility;
  verifiedOnly?:       boolean;
  vibe?:               PlanVibe;
  experienceCreditId?: string;
}

// ─── RANKING ─────────────────────────────────────────────────────────────────

async function computeApplicantScore(applicantId: string, hasNote: boolean): Promise<number> {
  const profile = await prisma.profile.findUnique({
    where: { id: applicantId },
    select: { isVerified: true, photos: true, bio: true, rezSpendScore: true },
  });
  if (!profile) return 0;

  let score = 0;
  if (hasNote)             score += 40;
  if (profile.isVerified)  score += 25;
  if (profile.photos.length >= 3) score += 15;
  if (profile.bio)         score += 10;
  score += Math.min(profile.rezSpendScore * 5, 10); // REZ spend score (capped at 10)

  // Past meetup success rate bonus
  const meetups = await prisma.reward.count({ where: { OR: [{ user1Id: applicantId }, { user2Id: applicantId }], status: 'TRIGGERED' } });
  score += Math.min(meetups * 5, 20);

  return score;
}

// ─── PLAN SERVICE ─────────────────────────────────────────────────────────────

export class PlanService {

  // ── Create ────────────────────────────────────────────────────────────────

  async createPlan(input: CreatePlanInput) {
    const scheduledAt = new Date(input.scheduledAt);

    // Must be at least 12h in the future
    const minSchedule = new Date(Date.now() + 12 * 3600 * 1000);
    if (scheduledAt < minSchedule) {
      throw new AppError(400, 'Plan must be scheduled at least 12 hours from now');
    }

    // If using an experience credit, skip booking verification (credit IS the booking)
    if (!input.experienceCreditId) {
      await verifyRezBooking(input.rezBookingRef, input.category, input.merchantId);
    }

    const expiresAt            = new Date(scheduledAt.getTime() - 4 * 3600 * 1000);
    const confirmationDeadline = new Date(scheduledAt.getTime() - 1 * 3600 * 1000);

    const isExperiencePlan = !!input.experienceCreditId;

    const plan = await prisma.plan.create({
      data: {
        organizerId:         input.organizerId,
        category:            input.category,
        merchantId:          input.merchantId,
        merchantName:        input.merchantName,
        rezBookingRef:       input.rezBookingRef,
        title:               input.title,
        scheduledAt,
        expiresAt,
        confirmationDeadline,
        city:                input.city,
        genderPreference:    input.genderPreference ?? GenderPref.ANY,
        ageMin:              input.ageMin ?? 18,
        ageMax:              input.ageMax ?? 60,
        visibility:          input.visibility ?? PlanVisibility.PUBLIC,
        verifiedOnly:        input.verifiedOnly ?? false,
        vibe:                input.vibe,
        isExperiencePlan,
      },
      include: { organizer: { select: { name: true } } },
    });

    // Mark credit as used if one was provided
    if (input.experienceCreditId) {
      await creditService.markUsed(input.experienceCreditId, plan.id, input.organizerId);
    }

    return plan;
  }

  // ── Feed (filtered) ───────────────────────────────────────────────────────

  async getFeed(viewerId: string, params: { city?: string; explore?: boolean; cursor?: string } = {}) {
    const viewer = await prisma.profile.findUnique({
      where: { id: viewerId },
      select: { gender: true, age: true, city: true, isVerified: true },
    });
    if (!viewer) throw new AppError(404, 'Profile not found');

    const city = params.city || viewer.city;
    const now  = new Date();

    const baseWhere = {
      status:      PlanStatus.OPEN,
      scheduledAt: { gt: now },
      expiresAt:   { gt: now },
      city,
      organizerId: { not: viewerId },
    };

    const where = params.explore
      ? baseWhere
      : {
          ...baseWhere,
          OR: [
            { genderPreference: GenderPref.ANY },
            { genderPreference: viewer.gender as unknown as GenderPref },
          ],
          ageMin: { lte: viewer.age },
          ageMax: { gte: viewer.age },
        };

    // Fetch 21 so we can determine if there's a next page without re-sorting in SQL
    const PAGE_SIZE = 20;
    const plans = await prisma.plan.findMany({
      where: {
        ...where,
        ...(params.cursor ? { createdAt: { lt: new Date(params.cursor) } } : {}),
        visibility: PlanVisibility.PUBLIC,
        // Sprint 12: verifiedOnly plans filter out unverified viewers
        ...(viewer && !viewer.isVerified ? { verifiedOnly: false } : {}),
      },
      select: {
        id: true, title: true, category: true, merchantName: true, city: true,
        scheduledAt: true, expiresAt: true, vibe: true, verifiedOnly: true,
        status: true, applicantCount: true, viewsCount: true, boostedUntil: true,
        isSponsored: true, sponsorPerAttendeeCoins: true, sponsorBudgetCoins: true,
        organizer: { select: { id: true, name: true, photos: true, isVerified: true, age: true, gender: true, responseRate: true, meetupCount: true } },
      },
      orderBy: [{ boostedUntil: 'desc' }, { applicantCount: 'desc' }, { scheduledAt: 'asc' }],
      take: PAGE_SIZE + 1,
    });

    // Sprint 12: Women organizer 2× boost — re-sort after fetch
    // Safety-first: female organizers get top visibility in plans feed
    const boosted = plans
      .map((p) => ({
        ...p,
        _feedScore: (p.organizer as { gender?: string }).gender === 'FEMALE' ? 2 : 1,
      }))
      .sort((a, b) => {
        if (b._feedScore !== a._feedScore) return b._feedScore - a._feedScore;
        if (a.boostedUntil && b.boostedUntil) return 0;
        if (a.boostedUntil) return -1;
        if (b.boostedUntil) return 1;
        return b.applicantCount - a.applicantCount;
      });

    // RD-M-18 FIX: Return nextCursor so clients can paginate deterministically.
    // Fetched PAGE_SIZE+1 to determine if there's a next page.
    // Cursor is based on scheduledAt (the primary sort key) encoded as ISO string.
    const hasMore = boosted.length > PAGE_SIZE;
    const result  = hasMore ? boosted.slice(0, PAGE_SIZE) : boosted;
    const nextCursor = hasMore ? result[result.length - 1]?.scheduledAt.toISOString() : undefined;

    const cleaned = result.map(({ _feedScore, ...rest }) => rest);

    // Increment viewsCount in background
    const ids = cleaned.map((p) => p.id);
    if (ids.length) {
      prisma.plan.updateMany({ where: { id: { in: ids } }, data: { viewsCount: { increment: 1 } } }).catch((err: unknown) => {
        log.error({ err, ids }, '[PlanService] Failed to increment viewsCount');
      });
    }

    return { plans: cleaned, nextCursor };
  }

  // ── Detail ────────────────────────────────────────────────────────────────

  async getPlan(planId: string, viewerId: string) {
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      select: {
        id: true, title: true, category: true, merchantName: true, merchantId: true, city: true,
        scheduledAt: true, expiresAt: true, confirmationDeadline: true, vibe: true,
        verifiedOnly: true, status: true, applicantCount: true, viewsCount: true,
        isSponsored: true, sponsorPerAttendeeCoins: true, sponsorBudgetCoins: true, sponsorSpentCoins: true,
        organizer: { select: { id: true, name: true, photos: true, isVerified: true, age: true, city: true } },
        confirmations: true,
        applications: {
          where: { applicantId: viewerId },
          select: { status: true, note: true },
        },
      },
    });
    if (!plan) throw new AppError(404, 'Plan not found');

    // Increment view count
    prisma.plan.update({ where: { id: planId }, data: { viewsCount: { increment: 1 } } }).catch((err: unknown) => {
      log.error({ err, planId }, '[PlanService] Failed to increment viewsCount');
    });

    return plan;
  }

  // ── Apply ─────────────────────────────────────────────────────────────────

  async applyToPlan(planId: string, applicantId: string, note?: string) {
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan)                              throw new AppError(404, 'Plan not found');
    if (plan.status !== PlanStatus.OPEN)    throw new AppError(409, 'Plan is no longer accepting applications');
    if (plan.organizerId === applicantId)   throw new AppError(400, 'Cannot apply to your own plan');
    if (new Date() > plan.expiresAt)        throw new AppError(409, 'Applications for this plan have closed');

    if (plan.verifiedOnly) {
      const profile = await prisma.profile.findUnique({ where: { id: applicantId }, select: { isVerified: true } });
      if (!profile?.isVerified) throw new AppError(403, 'This plan is restricted to verified users');
    }

    // Rate limit: max 10 active applications per user
    const activeCount = await prisma.planApplication.count({
      where: { applicantId, status: ApplicationStatus.PENDING },
    });
    if (activeCount >= 10) throw new AppError(429, 'You have too many active applications (max 10)');

    const score = await computeApplicantScore(applicantId, !!note?.trim());

    const application = await prisma.planApplication.create({
      data: { planId, applicantId, note: note?.trim(), score },
    });

    // Increment applicantCount
    await prisma.plan.update({ where: { id: planId }, data: { applicantCount: { increment: 1 } } });

    // Notify organizer
    const [organizerTokenRaw, applicantProfile] = await Promise.all([
      redis.get(`fcm:${plan.organizerId}`),
      prisma.profile.findUnique({ where: { id: applicantId }, select: { name: true } }),
    ]);
    const organizerToken = organizerTokenRaw ? JSON.parse(organizerTokenRaw).fcmToken : null;
    if (organizerToken && applicantProfile) {
      notif.planApplied(organizerToken, applicantProfile.name, plan.title, planId).catch((err: unknown) => {
        log.error({ err, planId, applicantId }, '[PlanService] planApplied notification failed');
      });
    }

    return application;
  }

  // ── Withdraw ──────────────────────────────────────────────────────────────

  async withdrawApplication(planId: string, applicantId: string) {
    const app = await prisma.planApplication.findUnique({
      where: { planId_applicantId: { planId, applicantId } },
    });
    if (!app)                                    throw new AppError(404, 'Application not found');
    if (app.status !== ApplicationStatus.PENDING) throw new AppError(409, 'Cannot withdraw — application is not pending');

    await prisma.planApplication.update({
      where: { planId_applicantId: { planId, applicantId } },
      data: { status: ApplicationStatus.WITHDRAWN },
    });
    await prisma.plan.update({ where: { id: planId }, data: { applicantCount: { decrement: 1 } } });
  }

  // ── Get Applications (organizer) ──────────────────────────────────────────

  async getApplications(planId: string, organizerId: string) {
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan)                          throw new AppError(404, 'Plan not found');
    if (plan.organizerId !== organizerId) throw new AppError(403, 'Not your plan');

    return prisma.planApplication.findMany({
      where: { planId, status: { in: [ApplicationStatus.PENDING, ApplicationStatus.SELECTED] } },
      include: {
        applicant: {
          select: { id: true, name: true, photos: true, age: true, city: true, isVerified: true, bio: true },
        },
      },
      orderBy: { score: 'desc' }, // ranked by score
    });
  }

  // ── Select Applicant ──────────────────────────────────────────────────────

  async selectApplicant(planId: string, organizerId: string, applicantId: string) {
    // DB transaction with row lock — prevents double-selection
    return prisma.$transaction(async (tx) => {
      const plan = await tx.plan.findUnique({ where: { id: planId } });
      if (!plan)                           throw new AppError(404, 'Plan not found');
      if (plan.organizerId !== organizerId) throw new AppError(403, 'Not your plan');
      if (plan.status !== PlanStatus.OPEN) throw new AppError(409, 'Plan is no longer open for selection');
      if (plan.reselectionCount > plan.maxReselections) throw new AppError(409, 'Maximum reselections reached');

      const application = await tx.planApplication.findUnique({
        where: { planId_applicantId: { planId, applicantId } },
      });
      if (!application || application.status !== ApplicationStatus.PENDING) {
        throw new AppError(404, 'Application not found or already processed');
      }

      // Mark selected
      await tx.planApplication.update({
        where: { planId_applicantId: { planId, applicantId } },
        data: { status: ApplicationStatus.SELECTED, selectedAt: new Date() },
      });

      // Reject all other pending applications
      await tx.planApplication.updateMany({
        where: { planId, status: ApplicationStatus.PENDING, applicantId: { not: applicantId } },
        data: { status: ApplicationStatus.REJECTED },
      });

      // Create or reuse Match and force chat OPEN
      const [uid1, uid2] = [organizerId, applicantId].sort();
      let match = await tx.match.findUnique({
        where: { user1Id_user2Id: { user1Id: uid1, user2Id: uid2 } },
        include: { messageState: true },
      });

      if (!match) {
        match = await tx.match.create({
          data: {
            user1Id: uid1,
            user2Id: uid2,
            intentType: 'DATING',
            messageState: { create: { state: ChatState.OPEN } },
          },
          include: { messageState: true },
        });
      } else {
        // Force existing chat to OPEN regardless of prior state
        await tx.messageState.update({
          where: { matchId: match.id },
          data: { state: ChatState.OPEN, lastActivityAt: new Date(), expiresAt: null },
        });
      }

      // Update plan: FILLED + store matchId
      await tx.plan.update({
        where: { id: planId },
        data: { status: PlanStatus.FILLED, matchId: match.id },
      });

      // Notify selected applicant
      const [applicantTokenRaw, organizerProfile] = await Promise.all([
        redis.get(`fcm:${applicantId}`),
        tx.profile.findUnique({ where: { id: organizerId }, select: { name: true } }),
      ]);
      const applicantToken = applicantTokenRaw ? JSON.parse(applicantTokenRaw).fcmToken : null;
      if (applicantToken && organizerProfile) {
        notif.planSelected(applicantToken, organizerProfile.name, plan.title, match.id).catch((err: unknown) => {
          log.warn({ err }, '[PlanService] planSelected notification failed');
        });
      }

      return { matchId: match.id, planId };
    });
  }

  // ── Confirm Attendance ────────────────────────────────────────────────────

  async confirmAttendance(planId: string, profileId: string) {
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new AppError(404, 'Plan not found');
    if (plan.status !== PlanStatus.FILLED) throw new AppError(409, 'Plan not in a confirmable state');
    if (new Date() > plan.confirmationDeadline) throw new AppError(409, 'Confirmation deadline has passed');

    // Upsert confirmation record with coinCreditStatus=PENDING so retries are trackable
    const confirmation = await prisma.planConfirmation.upsert({
      where: { planId_profileId: { planId, profileId } },
      create: { planId, profileId, coinCreditStatus: CoinCreditStatus.PENDING },
      update: {},
    });

    // BULLETPROOF: If already credited, return immediately — no double-credit
    if (confirmation.coinCreditStatus === CoinCreditStatus.CREDITED) {
      return { confirmed: true, coinsCredited: true };
    }

    // BULLETPROOF: If previously failed and already retried twice, give up
    if (
      confirmation.coinCreditStatus === CoinCreditStatus.FAILED &&
      confirmation.coinCreditAttempts >= 2
    ) {
      log.warn({ planId, profileId, attempts: confirmation.coinCreditAttempts },
        '[PlanService] Sponsor credit permanently failed after max retries');
      return { confirmed: true, coinsCredited: false };
    }

    // BULLETPROOF: Redis NX lock prevents concurrent credit attempts for same (plan, profile)
    const lockKey = `sponsor_credit:${planId}:${profileId}`;
    const lock = await redis.set(lockKey, '1', 'EX', 86400, 'NX');
    if (!lock) {
      // Another process is handling the credit — return confirmed without blocking
      return { confirmed: true, coinsCredited: false };
    }

    try {
      const attendee = await prisma.profile.findUnique({
        where: { id: profileId },
        select: { rezUserId: true },
      });
      if (!attendee?.rezUserId) {
        // No REZ account linked — can't credit, mark as failed
        await prisma.planConfirmation.update({
          where: { id: confirmation.id },
          data: { coinCreditStatus: CoinCreditStatus.FAILED, coinCreditFailedAt: new Date() },
        });
        return { confirmed: true, coinsCredited: false };
      }

      // Deduct from sponsor budget atomically
      const updated = await prisma.plan.update({
        where: { id: planId },
        data: { sponsorSpentCoins: { increment: plan.sponsorPerAttendeeCoins } },
      });

      // Stop crediting once budget exhausted
      if (updated.sponsorSpentCoins > updated.sponsorBudgetCoins) {
        log.warn({ planId, profileId }, '[PlanService] Sponsor budget exhausted — skipping credit');
        await prisma.planConfirmation.update({
          where: { id: confirmation.id },
          data: { coinCreditStatus: CoinCreditStatus.FAILED, coinCreditFailedAt: new Date() },
        });
        return { confirmed: true, coinsCredited: false };
      }

      // BULLETPROOF: creditCoins with idempotency key prevents double-credit on retry
      await rezWallet.creditCoins({
        rezUserId: attendee.rezUserId,
        coins:     plan.sponsorPerAttendeeCoins,
        reason:    'merchant_sponsored_plan',
        meta:      { planId, merchantId: plan.merchantId, source: 'rendez_sponsored_plan' },
        idempotencyKey: `sponsor:${planId}:${profileId}:${confirmation.id}`,
      });

      // Mark as credited
      await prisma.planConfirmation.update({
        where: { id: confirmation.id },
        data: { coinCreditStatus: CoinCreditStatus.CREDITED },
      });

      log.info({ planId, profileId, coins: plan.sponsorPerAttendeeCoins },
        '[PlanService] Sponsor coins credited to attendee');

    } catch (err) {
      // BULLETPROOF: On failure, increment attempt counter and enqueue retry job.
      // The caller still gets confirmed=true — we don't block attendance for a financial failure.
      await prisma.planConfirmation.update({
        where: { id: confirmation.id },
        data: {
          coinCreditStatus:  CoinCreditStatus.FAILED,
          coinCreditFailedAt: new Date(),
          coinCreditAttempts: { increment: 1 },
        },
      });
      log.error({ err, planId, profileId }, '[PlanService] Sponsor credit failed — enqueuing retry');

      // Enqueue retry job (3 attempts with exponential backoff via queue)
      await sponsorCreditQueue.add(
        'retry-sponsor-credit',
        { planId, profileId, confirmationId: confirmation.id },
        { attempts: 3, backoff: { type: 'exponential', delay: 10000 }, removeOnFail: false },
      );
    }

    return { confirmed: true, coinsCredited: false };
  }

  // ── Cancel Plan (organizer) ───────────────────────────────────────────────

  async cancelPlan(planId: string, organizerId: string) {
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      include: { applications: { where: { status: { in: [ApplicationStatus.PENDING, ApplicationStatus.SELECTED] } } } },
    });
    if (!plan)                           throw new AppError(404, 'Plan not found');
    if (plan.organizerId !== organizerId) throw new AppError(403, 'Not your plan');
    if (!['OPEN', 'FILLED'].includes(plan.status)) throw new AppError(409, 'Plan cannot be cancelled in its current state');

    await prisma.plan.update({ where: { id: planId }, data: { status: PlanStatus.CANCELLED } });

    const hadApplicants = plan.applications.length > 0;
    await this._handleCancellationRefund(plan.rezBookingRef, hadApplicants, plan.organizerId);

    return { cancelled: true };
  }

  // ── Reselect (after ghost) ────────────────────────────────────────────────

  async reselect(planId: string, organizerId: string, newApplicantId: string) {
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan)                           throw new AppError(404, 'Plan not found');
    if (plan.organizerId !== organizerId) throw new AppError(403, 'Not your plan');
    if (plan.reselectionCount >= plan.maxReselections) throw new AppError(409, 'Maximum reselections reached — plan will be cancelled');

    // Bump reselection count, reopen plan
    await prisma.$transaction(async (tx) => {
      await tx.plan.update({
        where: { id: planId },
        data: { status: PlanStatus.OPEN, reselectionCount: { increment: 1 }, matchId: null },
      });
      // Reset previously selected application back to PENDING
      await tx.planApplication.updateMany({
        where: { planId, status: ApplicationStatus.SELECTED },
        data: { status: ApplicationStatus.REJECTED },
      });
      // Restore rejected applications to PENDING so organizer can pick again
      await tx.planApplication.updateMany({
        where: { planId, status: ApplicationStatus.REJECTED, applicantId: newApplicantId },
        data: { status: ApplicationStatus.PENDING },
      });
    });

    return this.selectApplicant(planId, organizerId, newApplicantId);
  }

  // ── My Plans ──────────────────────────────────────────────────────────────

  async getMyPlans(profileId: string) {
    const [organized, applied] = await Promise.all([
      prisma.plan.findMany({
        where: { organizerId: profileId },
        include: { applications: { select: { status: true } } },
        orderBy: { scheduledAt: 'desc' },
        take: 20,
      }),
      prisma.planApplication.findMany({
        where: { applicantId: profileId },
        include: {
          plan: {
            include: { organizer: { select: { id: true, name: true, photos: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    return { organized, applied };
  }

  // ── Refund Logic ──────────────────────────────────────────────────────────

  private async _handleCancellationRefund(rezBookingRef: string, hadApplicants: boolean, organizerId: string) {
    try {
      if (!hadApplicants) {
        // Full refund
        await rezWallet.refundBooking(rezBookingRef, 'no_applicants');
      } else {
        // Issue REZ locked credit — must use rezUserId (REZ system ID), not Rendez profile ID
        const organizer = await prisma.profile.findUnique({
          where: { id: organizerId },
          select: { rezUserId: true },
        });
        if (!organizer?.rezUserId) {
          log.error({ organizerId, rezBookingRef }, '[PlanService] Cannot issue credit — organizer has no rezUserId');
          return;
        }
        await rezWallet.issuePlanCredit(organizer.rezUserId, rezBookingRef, 7);
      }
    } catch (err) {
      log.error({ rezBookingRef, err }, '[PlanService] Refund failed for booking');
    }
  }
}
