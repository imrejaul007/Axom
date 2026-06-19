/**
 * Reward trigger worker — processes BullMQ jobs for meetup reward validation.
 *
 * RZ-B-H3 FIX: Replaces the fire-and-forget .catch() pattern in MeetupService.checkin
 * with a BullMQ queue that provides:
 *   - Automatic retries (3 attempts, exponential backoff)
 *   - Dead Letter Queue for failed jobs
 *   - Visibility timeout independent of Redis NX lock
 */

import { Worker } from 'bullmq';
import { redis } from '../config/redis';
import { prisma } from '../config/database';
import { NotificationService } from '../services/NotificationService';
import { ReferralService } from '../services/ReferralService';
import { log } from '../config/telemetry';
import { RewardService } from '../services/RewardService';
import * as rezWallet from '../integrations/rez/rezWalletClient';
import { rewardTriggerQueue } from '../jobs/queue';

const MEETUP_BONUS_COINS = 50; // Rendez P2: "showed up" bonus per verified meetup participant

const notif = new NotificationService();
const referral = new ReferralService();
const reward = new RewardService();

interface RewardTriggerJob {
  matchId: string;
  bookingId: string;
  user1Id: string;
  user2Id: string;
}

async function processRewardTrigger(job: RewardTriggerJob): Promise<void> {
  const { matchId, bookingId, user1Id, user2Id } = job;

  try {
    // Trigger reward via RewardService (handles fraud checks, DB record, and REZ API)
    await reward.triggerMeetupReward({ matchId, bookingId });
  } catch (err) {
    log.error({ err }, '[RewardTrigger] Reward trigger failed');
    throw err; // rethrow so BullMQ can retry
  }

  // P2 FIX: Credit both participants a "showed up" bonus in REZ coins.
  // Idempotent: skip if already credited (Redis lock ensures single execution).
  const bonusLockKey = `meetup_bonus:${bookingId}`;
  const bonusLock = await redis.set(bonusLockKey, '1', 'EX', 86400, 'NX');
  if (bonusLock) {
    const participants = await prisma.profile.findMany({
      where: { id: { in: [user1Id, user2Id] }, isSuspended: false },
      select: { id: true, rezUserId: true },
    });
    const valid = participants.filter((p) => p.rezUserId);
    if (valid.length === 2) {
      // BULLETPROOF: creditMeetupBonus now uses sequential awaits + idempotency keys internally.
      // Each participant gets their own idempotency key so partial failure is detectable.
      try {
        await rezWallet.creditMeetupBonus(bookingId, [
          { rezUserId: valid[0].rezUserId!, coins: MEETUP_BONUS_COINS },
          { rezUserId: valid[1].rezUserId!, coins: MEETUP_BONUS_COINS },
        ]);
        log.info({ bookingId, participants: valid.length, coins: MEETUP_BONUS_COINS },
          '[RewardTrigger] Meetup attendance bonus credited');
      } catch (err) {
        // Log but don't throw — bonus is non-critical; reward was already triggered
        log.error({ err, bookingId }, '[RewardTrigger] Meetup bonus credit failed — non-critical');
      }
    }
  }

  // Increment meetupCount for both participants (trust signal / profile badge)
  await prisma.profile.updateMany({
    where: { id: { in: [user1Id, user2Id] } },
    data: { meetupCount: { increment: 1 } },
  });

  // Credit referrers if eligible (uses its own Redis lock internally)
  await referral.creditReferrerIfEligible(user1Id);
  await referral.creditReferrerIfEligible(user2Id);

  // Send reward push notifications
  const [token1Raw, token2Raw] = await Promise.all([
    redis.get(`fcm:${user1Id}`),
    redis.get(`fcm:${user2Id}`),
  ]);
  const t1 = token1Raw ? (() => { try { return JSON.parse(token1Raw).fcmToken; } catch { return null; } })() : null;
  const t2 = token2Raw ? (() => { try { return JSON.parse(token2Raw).fcmToken; } catch { return null; } })() : null;
  if (t1 && t2) {
    await notif.rewardTriggered(t1, t2).catch((err: unknown) => {
      log.warn({ err }, '[RewardTrigger] Notification failed');
    });
  }

  // Release the Redis lock so future checkins can proceed
  const lockKey = `reward_lock:${matchId}:${bookingId}`;
  await redis.del(lockKey);
}

// Worker with concurrency:1 to prevent double-processing of the same meetup
export const rewardTriggerWorker = new Worker(
  'reward-trigger',
  async (job) => {
    await processRewardTrigger(job.data as RewardTriggerJob);
  },
  {
    connection: redis,
    concurrency: 1,
    // C-28 FIX: Job timeout enforcement - prevent stuck jobs
    lockDuration: 30000, // 30 second lock
    lockRenewTime: 5000, // Renew lock every 5 seconds
    stalledInterval: 30000, // Check for stalled jobs every 30 seconds
    maxStalledCount: 2, // Fail job after 2 stalled attempts
  },
);

rewardTriggerWorker.on('failed', (job, err) => {
  const jobData = job?.data as RewardTriggerJob | undefined;
  log.error({ err: { message: err.message }, jobData }, '[RewardTrigger] Job failed');
});

rewardTriggerWorker.on('completed', (job) => {
  const jobData = job?.data as RewardTriggerJob | undefined;
  log.info({ matchId: jobData?.matchId }, '[RewardTrigger] Job completed');
});

rewardTriggerWorker.on('stalled', (jobId: string) => {
  log.warn({ jobId }, '[RewardTrigger] Job stalled (lock expired without renewal)');
});
