"use strict";
/**
 * Reward trigger worker — processes BullMQ jobs for meetup reward validation.
 *
 * RZ-B-H3 FIX: Replaces the fire-and-forget .catch() pattern in MeetupService.checkin
 * with a BullMQ queue that provides:
 *   - Automatic retries (3 attempts, exponential backoff)
 *   - Dead Letter Queue for failed jobs
 *   - Visibility timeout independent of Redis NX lock
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.rewardTriggerWorker = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = require("../config/redis");
const database_1 = require("../config/database");
const NotificationService_1 = require("../services/NotificationService");
const ReferralService_1 = require("../services/ReferralService");
const telemetry_1 = require("../config/telemetry");
const RewardService_1 = require("../services/RewardService");
const rezWallet = __importStar(require("../integrations/rez/rezWalletClient"));
const MEETUP_BONUS_COINS = 50; // Rendez P2: "showed up" bonus per verified meetup participant
const notif = new NotificationService_1.NotificationService();
const referral = new ReferralService_1.ReferralService();
const reward = new RewardService_1.RewardService();
async function processRewardTrigger(job) {
    const { matchId, bookingId, user1Id, user2Id } = job;
    try {
        // Trigger reward via RewardService (handles fraud checks, DB record, and REZ API)
        await reward.triggerMeetupReward({ matchId, bookingId });
    }
    catch (err) {
        telemetry_1.log.error({ err }, '[RewardTrigger] Reward trigger failed');
        throw err; // rethrow so BullMQ can retry
    }
    // P2 FIX: Credit both participants a "showed up" bonus in REZ coins.
    // Idempotent: skip if already credited (Redis lock ensures single execution).
    const bonusLockKey = `meetup_bonus:${bookingId}`;
    const bonusLock = await redis_1.redis.set(bonusLockKey, '1', 'EX', 86400, 'NX');
    if (bonusLock) {
        const participants = await database_1.prisma.profile.findMany({
            where: { id: { in: [user1Id, user2Id] }, isSuspended: false },
            select: { id: true, rezUserId: true },
        });
        const valid = participants.filter((p) => p.rezUserId);
        if (valid.length === 2) {
            // BULLETPROOF: creditMeetupBonus now uses sequential awaits + idempotency keys internally.
            // Each participant gets their own idempotency key so partial failure is detectable.
            try {
                await rezWallet.creditMeetupBonus(bookingId, [
                    { rezUserId: valid[0].rezUserId, coins: MEETUP_BONUS_COINS },
                    { rezUserId: valid[1].rezUserId, coins: MEETUP_BONUS_COINS },
                ]);
                telemetry_1.log.info({ bookingId, participants: valid.length, coins: MEETUP_BONUS_COINS }, '[RewardTrigger] Meetup attendance bonus credited');
            }
            catch (err) {
                // Log but don't throw — bonus is non-critical; reward was already triggered
                telemetry_1.log.error({ err, bookingId }, '[RewardTrigger] Meetup bonus credit failed — non-critical');
            }
        }
    }
    // Increment meetupCount for both participants (trust signal / profile badge)
    await database_1.prisma.profile.updateMany({
        where: { id: { in: [user1Id, user2Id] } },
        data: { meetupCount: { increment: 1 } },
    });
    // Credit referrers if eligible (uses its own Redis lock internally)
    await referral.creditReferrerIfEligible(user1Id);
    await referral.creditReferrerIfEligible(user2Id);
    // Send reward push notifications
    const [token1Raw, token2Raw] = await Promise.all([
        redis_1.redis.get(`fcm:${user1Id}`),
        redis_1.redis.get(`fcm:${user2Id}`),
    ]);
    const t1 = token1Raw ? (() => { try {
        return JSON.parse(token1Raw).fcmToken;
    }
    catch {
        return null;
    } })() : null;
    const t2 = token2Raw ? (() => { try {
        return JSON.parse(token2Raw).fcmToken;
    }
    catch {
        return null;
    } })() : null;
    if (t1 && t2) {
        await notif.rewardTriggered(t1, t2).catch((err) => {
            telemetry_1.log.warn({ err }, '[RewardTrigger] Notification failed');
        });
    }
    // Release the Redis lock so future checkins can proceed
    const lockKey = `reward_lock:${matchId}:${bookingId}`;
    await redis_1.redis.del(lockKey);
}
// Worker with concurrency:1 to prevent double-processing of the same meetup
exports.rewardTriggerWorker = new bullmq_1.Worker('reward-trigger', async (job) => {
    await processRewardTrigger(job.data);
}, {
    connection: redis_1.redis,
    concurrency: 1,
    // C-28 FIX: Job timeout enforcement - prevent stuck jobs
    lockDuration: 30000, // 30 second lock
    lockRenewTime: 5000, // Renew lock every 5 seconds
    stalledInterval: 30000, // Check for stalled jobs every 30 seconds
    maxStalledCount: 2, // Fail job after 2 stalled attempts
});
exports.rewardTriggerWorker.on('failed', (job, err) => {
    const jobData = job?.data;
    telemetry_1.log.error({ err: { message: err.message }, jobData }, '[RewardTrigger] Job failed');
});
exports.rewardTriggerWorker.on('completed', (job) => {
    const jobData = job?.data;
    telemetry_1.log.info({ matchId: jobData?.matchId }, '[RewardTrigger] Job completed');
});
exports.rewardTriggerWorker.on('stalled', (jobId) => {
    telemetry_1.log.warn({ jobId }, '[RewardTrigger] Job stalled (lock expired without renewal)');
});
