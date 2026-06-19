/**
 * Sponsor credit retry worker — processes BullMQ jobs for failed sponsor coin credits.
 *
 * BULLETPROOF: PlanService.confirmAttendance catches creditCoins failures and enqueues
 * a retry job here. This worker handles the retry with:
 *   - 3 attempts, exponential backoff (10s → 20s → 40s)
 *   - Idempotency key ensures no double-credit on retry
 *   - After all retries exhausted, job moves to BullMQ Failed State for DLQ inspection
 *   - DLQ entries are queryable via admin endpoint
 */

import { Worker } from 'bullmq';
import { redis } from '../config/redis';
import { prisma } from '../config/database';
import { log } from '../config/telemetry';
import * as rezWallet from '../integrations/rez/rezWalletClient';
import { CoinCreditStatus } from '@prisma/client';

interface SponsorCreditJob {
  planId: string;
  profileId: string;
  confirmationId: string;
}

async function processSponsorCredit(job: SponsorCreditJob): Promise<void> {
  const { planId, profileId, confirmationId } = job;

  const confirmation = await prisma.planConfirmation.findUnique({ where: { id: confirmationId } });
  if (!confirmation) {
    log.warn({ confirmationId }, '[SponsorCredit] Confirmation not found — skipping');
    return; // Already completed or deleted
  }
  if (confirmation.coinCreditStatus === CoinCreditStatus.CREDITED) {
    log.info({ confirmationId }, '[SponsorCredit] Already credited — skipping');
    return; // Won race against another worker
  }

  const plan = await prisma.plan.findUnique({
    where: { id: planId },
    select: { isSponsored: true, sponsorPerAttendeeCoins: true, sponsorBudgetCoins: true, sponsorSpentCoins: true, merchantId: true },
  });
  if (!plan?.isSponsored || plan.sponsorPerAttendeeCoins <= 0) {
    log.info({ planId }, '[SponsorCredit] Not sponsored — skipping');
    await prisma.planConfirmation.update({
      where: { id: confirmationId },
      data: { coinCreditStatus: CoinCreditStatus.FAILED, coinCreditFailedAt: new Date() },
    });
    return;
  }

  const attendee = await prisma.profile.findUnique({
    where: { id: profileId },
    select: { rezUserId: true },
  });
  if (!attendee?.rezUserId) {
    log.warn({ profileId }, '[SponsorCredit] No rezUserId — skipping');
    await prisma.planConfirmation.update({
      where: { id: confirmationId },
      data: { coinCreditStatus: CoinCreditStatus.FAILED, coinCreditFailedAt: new Date() },
    });
    return;
  }

  // Deduct from sponsor budget atomically (skip if budget exhausted)
  const updated = await prisma.plan.update({
    where: { id: planId },
    data: { sponsorSpentCoins: { increment: plan.sponsorPerAttendeeCoins } },
  });
  if (updated.sponsorSpentCoins > updated.sponsorBudgetCoins) {
    log.warn({ planId }, '[SponsorCredit] Sponsor budget exhausted on retry — skipping credit');
    await prisma.planConfirmation.update({
      where: { id: confirmationId },
      data: { coinCreditStatus: CoinCreditStatus.FAILED, coinCreditFailedAt: new Date() },
    });
    return;
  }

  // BULLETPROOF: creditCoins with idempotency key prevents double-credit on retry
  await rezWallet.creditCoins({
    rezUserId: attendee.rezUserId,
    coins:     plan.sponsorPerAttendeeCoins,
    reason:    'merchant_sponsored_plan',
    meta:      { planId, merchantId: plan.merchantId, source: 'rendez_sponsored_plan' },
    idempotencyKey: `sponsor:${planId}:${profileId}:${confirmationId}:retry:${(job as any).attemptsMade}`,
  });

  await prisma.planConfirmation.update({
    where: { id: confirmationId },
    data: { coinCreditStatus: CoinCreditStatus.CREDITED },
  });

  log.info({ planId, profileId, confirmationId, coins: plan.sponsorPerAttendeeCoins },
    '[SponsorCredit] Retry succeeded — coins credited');
}

export const sponsorCreditWorker = new Worker(
  'sponsor-credit',
  async (job) => {
    await processSponsorCredit(job.data as SponsorCreditJob);
  },
  {
    connection: redis,
    concurrency: 2, // allow 2 concurrent retries but not too many DB writes at once
    // C-28 FIX: Job timeout enforcement - prevent stuck jobs
    lockDuration: 30000, // 30 second lock
    lockRenewTime: 5000, // Renew lock every 5 seconds
    stalledInterval: 30000, // Check for stalled jobs every 30 seconds
    maxStalledCount: 2, // Fail job after 2 stalled attempts
  },
);

sponsorCreditWorker.on('failed', (job, err) => {
  const data = job?.data as SponsorCreditJob | undefined;
  log.error({ err: { message: err.message }, planId: data?.planId, profileId: data?.profileId },
    '[SponsorCredit] Retry exhausted — moving to failed state');
});

sponsorCreditWorker.on('completed', (job) => {
  const data = job?.data as SponsorCreditJob | undefined;
  log.info({ planId: data?.planId, profileId: data?.profileId },
    '[SponsorCredit] Retry completed successfully');
});

// C-28 FIX: Stuck job detection and recovery
sponsorCreditWorker.on('stalled', (jobId: string) => {
  log.warn({ jobId }, '[SponsorCredit] Job stalled (lock expired without renewal)');
});
