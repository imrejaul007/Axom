import { Queue } from 'bullmq';
import { redis } from '../config/redis';
import { log } from '../config/telemetry';

export const sponsorCreditQueue = new Queue('sponsor-credit', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 10000 },
    removeOnComplete: 10,
    removeOnFail: false, // keep for DLQ inspection
  },
});

export const giftExpiryQueue = new Queue('gift-expiry', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: false, // keep failed jobs for DLQ inspection
  },
});

// Dead Letter Queue for persistently failing gift expiry jobs
export const giftExpiryDLQ = new Queue('gift-expiry-dlq', { connection: redis });

export const matchExpiryQueue = new Queue('match-expiry', {
  connection: redis,
  defaultJobOptions: { removeOnComplete: 10 },
});

export const catalogCacheQueue = new Queue('catalog-cache', {
  connection: redis,
  defaultJobOptions: { removeOnComplete: 5 },
});

export const planExpiryQueue = new Queue('plan-expiry', {
  connection: redis,
  defaultJobOptions: { removeOnComplete: 10 },
});

export const ghostDetectQueue = new Queue('plan-ghost', {
  connection: redis,
  defaultJobOptions: { removeOnComplete: 10 },
});

export const autoCancelQueue = new Queue('plan-cancel', {
  connection: redis,
  defaultJobOptions: { removeOnComplete: 10 },
});

// Daily trust decay: shadowScore × 0.85, responseRate nudge for inactive users
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
export const trustDecayQueue = new Queue('trust-decay', {
  connection: redis,
  defaultJobOptions: { removeOnComplete: 5 },
});

// RZ-B-H3 FIX: Dedicated queue for meetup reward triggers with retry support.
// Previously fire-and-forget; failures silently lost user rewards.
export const rewardTriggerQueue = new Queue('reward-trigger', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 10,
    removeOnFail: false, // keep for inspection
  },
});

export async function startRecurringJobs() {
  // Remove existing repeatable jobs before re-adding to prevent duplicates on restart
  await Promise.all([
    giftExpiryQueue.removeRepeatable('check-expired-gifts',   { every: 5 * 60 * 1000 }),
    matchExpiryQueue.removeRepeatable('check-expired-matches', { every: 30 * 60 * 1000 }),
    catalogCacheQueue.removeRepeatable('refresh-catalog',      { every: 6 * 60 * 60 * 1000 }),
    planExpiryQueue.removeRepeatable('expire-plans',           { every: 10 * 60 * 1000 }),
    ghostDetectQueue.removeRepeatable('detect-ghosts',         { every: 15 * 60 * 1000 }),
    autoCancelQueue.removeRepeatable('auto-cancel-plans',      { every: 30 * 60 * 1000 }),
    trustDecayQueue.removeRepeatable('trust-decay-daily',      { every: ONE_DAY_MS }),
  ]).catch(() => {});

  await Promise.all([
    giftExpiryQueue.add('check-expired-gifts',   {}, { repeat: { every: 5 * 60 * 1000 } }),
    matchExpiryQueue.add('check-expired-matches', {}, { repeat: { every: 30 * 60 * 1000 } }),
    catalogCacheQueue.add('refresh-catalog', { cities: ['mumbai', 'delhi', 'bangalore'] }, { repeat: { every: 6 * 60 * 60 * 1000 } }),
    planExpiryQueue.add('expire-plans',       {}, { repeat: { every: 10 * 60 * 1000 } }),
    ghostDetectQueue.add('detect-ghosts',     {}, { repeat: { every: 15 * 60 * 1000 } }),
    autoCancelQueue.add('auto-cancel-plans',  {}, { repeat: { every: 30 * 60 * 1000 } }),
    trustDecayQueue.add('trust-decay-daily',  {}, { repeat: { every: ONE_DAY_MS } }),
  ]);

  log.info('[Jobs] Recurring jobs scheduled (7 workers)');
}
