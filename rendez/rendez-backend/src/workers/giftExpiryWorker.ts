import { Worker, QueueEvents } from 'bullmq';
import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { GiftStatus } from '@prisma/client';
import * as rezWallet from '../integrations/rez/rezWalletClient';
import { MessagingService } from '../services/MessagingService';
import { giftExpiryQueue, giftExpiryDLQ } from '../jobs/queue';
import { log } from '../config/telemetry';

const messaging = new MessagingService();

// H-7 FIX: Added retry limits and a Dead Letter Queue (DLQ) so persistently failing
// expiry jobs are not silently dropped — they land in the DLQ for manual investigation.
// RZ-B-L6 FIX: Import giftExpiryQueue from jobs/queue.ts instead of defining a duplicate.
// The queue is now the single canonical definition with retry+DLQ config.

export const giftExpiryWorker = new Worker(
  'gift-expiry',
  async () => {
    const expiredGifts = await prisma.gift.findMany({
      where: { status: GiftStatus.PENDING, expiresAt: { lte: new Date() } },
    });

    for (const gift of expiredGifts) {
      try {
        if (gift.rezHoldId) await rezWallet.refundHold(gift.rezHoldId, 'gift_expired');
        await prisma.gift.update({ where: { id: gift.id }, data: { status: GiftStatus.EXPIRED } });
        await messaging.revertToLocked(gift.matchId);
      } catch (err) {
        log.error({ giftId: gift.id, err }, '[GiftExpiry] Failed for gift');
        // Rethrow so BullMQ applies the retry/backoff policy defined above
        throw err;
      }
    }
  },
  {
    connection: redis,
    // Worker-level concurrency: process one batch at a time to avoid race conditions
    concurrency: 1,
    // C-28 FIX: Job timeout enforcement - prevent stuck jobs
    lockDuration: 30000, // 30 second lock
    lockRenewTime: 5000, // Renew lock every 5 seconds
    stalledInterval: 30000, // Check for stalled jobs every 30 seconds
    maxStalledCount: 2, // Fail job after 2 stalled attempts
  },
);

giftExpiryWorker.on('stalled', (jobId: string) => {
  log.warn({ jobId }, '[GiftExpiry] Job stalled (lock expired without renewal)');
});

// H-7 FIX: Move jobs that have exhausted all retries into the DLQ for manual review
const giftExpiryEvents = new QueueEvents('gift-expiry', { connection: redis });
giftExpiryEvents.on('failed', async ({ jobId, failedReason }) => {
  const job = await giftExpiryQueue.getJob(jobId);
  if (!job) return;
  const isExhausted = (job.attemptsMade ?? 0) >= (job.opts?.attempts ?? 3);
  if (isExhausted) {
    log.error({ jobId, failedReason }, '[GiftExpiry] Job exhausted retries — moving to DLQ');
    await giftExpiryDLQ.add('dead-gift-expiry', { jobId, failedReason, jobData: job.data }, {
      removeOnComplete: false,
      removeOnFail: false,
    });
  }
});
