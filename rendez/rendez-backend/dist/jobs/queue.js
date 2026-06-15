"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rewardTriggerQueue = exports.trustDecayQueue = exports.autoCancelQueue = exports.ghostDetectQueue = exports.planExpiryQueue = exports.catalogCacheQueue = exports.matchExpiryQueue = exports.giftExpiryDLQ = exports.giftExpiryQueue = exports.sponsorCreditQueue = void 0;
exports.startRecurringJobs = startRecurringJobs;
const bullmq_1 = require("bullmq");
const redis_1 = require("../config/redis");
const telemetry_1 = require("../config/telemetry");
exports.sponsorCreditQueue = new bullmq_1.Queue('sponsor-credit', {
    connection: redis_1.redis,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 10000 },
        removeOnComplete: 10,
        removeOnFail: false, // keep for DLQ inspection
    },
});
exports.giftExpiryQueue = new bullmq_1.Queue('gift-expiry', {
    connection: redis_1.redis,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 100 },
        removeOnFail: false, // keep failed jobs for DLQ inspection
    },
});
// Dead Letter Queue for persistently failing gift expiry jobs
exports.giftExpiryDLQ = new bullmq_1.Queue('gift-expiry-dlq', { connection: redis_1.redis });
exports.matchExpiryQueue = new bullmq_1.Queue('match-expiry', {
    connection: redis_1.redis,
    defaultJobOptions: { removeOnComplete: 10 },
});
exports.catalogCacheQueue = new bullmq_1.Queue('catalog-cache', {
    connection: redis_1.redis,
    defaultJobOptions: { removeOnComplete: 5 },
});
exports.planExpiryQueue = new bullmq_1.Queue('plan-expiry', {
    connection: redis_1.redis,
    defaultJobOptions: { removeOnComplete: 10 },
});
exports.ghostDetectQueue = new bullmq_1.Queue('plan-ghost', {
    connection: redis_1.redis,
    defaultJobOptions: { removeOnComplete: 10 },
});
exports.autoCancelQueue = new bullmq_1.Queue('plan-cancel', {
    connection: redis_1.redis,
    defaultJobOptions: { removeOnComplete: 10 },
});
// Daily trust decay: shadowScore × 0.85, responseRate nudge for inactive users
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
exports.trustDecayQueue = new bullmq_1.Queue('trust-decay', {
    connection: redis_1.redis,
    defaultJobOptions: { removeOnComplete: 5 },
});
// RZ-B-H3 FIX: Dedicated queue for meetup reward triggers with retry support.
// Previously fire-and-forget; failures silently lost user rewards.
exports.rewardTriggerQueue = new bullmq_1.Queue('reward-trigger', {
    connection: redis_1.redis,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 10,
        removeOnFail: false, // keep for inspection
    },
});
async function startRecurringJobs() {
    // Remove existing repeatable jobs before re-adding to prevent duplicates on restart
    await Promise.all([
        exports.giftExpiryQueue.removeRepeatable('check-expired-gifts', { every: 5 * 60 * 1000 }),
        exports.matchExpiryQueue.removeRepeatable('check-expired-matches', { every: 30 * 60 * 1000 }),
        exports.catalogCacheQueue.removeRepeatable('refresh-catalog', { every: 6 * 60 * 60 * 1000 }),
        exports.planExpiryQueue.removeRepeatable('expire-plans', { every: 10 * 60 * 1000 }),
        exports.ghostDetectQueue.removeRepeatable('detect-ghosts', { every: 15 * 60 * 1000 }),
        exports.autoCancelQueue.removeRepeatable('auto-cancel-plans', { every: 30 * 60 * 1000 }),
        exports.trustDecayQueue.removeRepeatable('trust-decay-daily', { every: ONE_DAY_MS }),
    ]).catch(() => { });
    await Promise.all([
        exports.giftExpiryQueue.add('check-expired-gifts', {}, { repeat: { every: 5 * 60 * 1000 } }),
        exports.matchExpiryQueue.add('check-expired-matches', {}, { repeat: { every: 30 * 60 * 1000 } }),
        exports.catalogCacheQueue.add('refresh-catalog', { cities: ['mumbai', 'delhi', 'bangalore'] }, { repeat: { every: 6 * 60 * 60 * 1000 } }),
        exports.planExpiryQueue.add('expire-plans', {}, { repeat: { every: 10 * 60 * 1000 } }),
        exports.ghostDetectQueue.add('detect-ghosts', {}, { repeat: { every: 15 * 60 * 1000 } }),
        exports.autoCancelQueue.add('auto-cancel-plans', {}, { repeat: { every: 30 * 60 * 1000 } }),
        exports.trustDecayQueue.add('trust-decay-daily', {}, { repeat: { every: ONE_DAY_MS } }),
    ]);
    telemetry_1.log.info('[Jobs] Recurring jobs scheduled (7 workers)');
}
