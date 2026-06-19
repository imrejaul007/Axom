/**
 * trustDecayWorker — runs daily, decays shadowScore for users who
 * have started responding to message requests (keeping the score
 * from permanently suppressing rehabilitated users).
 *
 * Decay rule:
 *   newScore = max(0, shadowScore * 0.85)
 *   Only update profiles where shadowScore > 0.1 (skip near-zero)
 *
 * Also resets responseRate toward 1.0 for long-inactive users so
 * old non-responses don't permanently tank their ranking.
 */

import { Worker } from 'bullmq';
import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { log } from '../config/telemetry';

export const trustDecayWorker = new Worker(
  'trust-decay',
  async () => {
    try {
      // Decay shadowScore: multiply by 0.85 daily
      // Prisma doesn't support multiply-in-place, so fetch and batch update
      const elevated = await prisma.profile.findMany({
        where: { shadowScore: { gt: 0.1 } },
        select: { id: true, shadowScore: true, responseRate: true, lastActiveAt: true },
      });

      const now = Date.now();
      const updates = elevated.map((p) => {
        const newShadow = Math.max(0, p.shadowScore * 0.85);

        // If inactive > 30 days, gently nudge responseRate back toward 1.0
        const daysSinceActive = (now - p.lastActiveAt.getTime()) / (1000 * 60 * 60 * 24);
        const newResponseRate =
          daysSinceActive > 30
            ? Math.min(1.0, p.responseRate + 0.05)
            : p.responseRate;

        return prisma.profile.update({
          where: { id: p.id },
          data: { shadowScore: newShadow, responseRate: newResponseRate },
        });
      });

      // Run in batches of 50 to avoid DB overload
      for (let i = 0; i < updates.length; i += 50) {
        await Promise.all(updates.slice(i, i + 50));
      }

      log.info({ count: elevated.length }, '[TrustDecay] Processed profiles');
    } catch (err) {
      // RD-L-07 FIX: Catch and log DB errors explicitly.
      // BullMQ swallows unhandled promise rejections silently in some configurations,
      // so re-throwing ensures the job is marked as failed and retried.
      log.error({ err }, '[TrustDecay] Worker error');
      throw err;
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

trustDecayWorker.on('stalled', (jobId: string) => {
  log.warn({ jobId }, '[TrustDecay] Job stalled (lock expired without renewal)');
});
