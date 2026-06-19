import { Worker, Queue } from 'bullmq';
import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { ChatState } from '@prisma/client';
import { log } from '../config/telemetry';

export const matchExpiryQueue = new Queue('match-expiry', { connection: redis });

export const matchExpiryWorker = new Worker(
  'match-expiry',
  async () => {
    const expiredStates = await prisma.messageState.findMany({
      where: {
        state: { in: [ChatState.FREE_MSG_SENT, ChatState.AWAITING_REPLY] },
        expiresAt: { lte: new Date() },
      },
    });

    for (const state of expiredStates) {
      try {
        await prisma.messageState.update({
          where: { id: state.id },
          data: { state: ChatState.LOCKED },
        });
      } catch (err) {
        log.error({ stateId: state.id, err }, '[MatchExpiry] Failed for state');
        throw err; // re-throw so BullMQ can retry
      }
    }
  },
  {
    connection: redis,
    // C-28 FIX: Job timeout enforcement - prevent stuck jobs
    lockDuration: 30000, // 30 second lock
    lockRenewTime: 5000, // Renew lock every 5 seconds
    stalledInterval: 30000, // Check for stalled jobs every 30 seconds
    maxStalledCount: 2, // Fail job after 2 stalled attempts
  },
);

matchExpiryWorker.on('stalled', (jobId: string) => {
  log.warn({ jobId }, '[MatchExpiry] Job stalled (lock expired without renewal)');
});
