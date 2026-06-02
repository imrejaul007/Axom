"use strict";
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
exports.giftExpiryWorker = void 0;
const bullmq_1 = require("bullmq");
const database_1 = require("../config/database");
const redis_1 = require("../config/redis");
const client_1 = require("@prisma/client");
const rezWallet = __importStar(require("../integrations/rez/rezWalletClient"));
const MessagingService_1 = require("../services/MessagingService");
const queue_1 = require("../jobs/queue");
const telemetry_1 = require("../config/telemetry");
const messaging = new MessagingService_1.MessagingService();
// H-7 FIX: Added retry limits and a Dead Letter Queue (DLQ) so persistently failing
// expiry jobs are not silently dropped — they land in the DLQ for manual investigation.
// RZ-B-L6 FIX: Import giftExpiryQueue from jobs/queue.ts instead of defining a duplicate.
// The queue is now the single canonical definition with retry+DLQ config.
exports.giftExpiryWorker = new bullmq_1.Worker('gift-expiry', async () => {
    const expiredGifts = await database_1.prisma.gift.findMany({
        where: { status: client_1.GiftStatus.PENDING, expiresAt: { lte: new Date() } },
    });
    for (const gift of expiredGifts) {
        try {
            if (gift.rezHoldId)
                await rezWallet.refundHold(gift.rezHoldId, 'gift_expired');
            await database_1.prisma.gift.update({ where: { id: gift.id }, data: { status: client_1.GiftStatus.EXPIRED } });
            await messaging.revertToLocked(gift.matchId);
        }
        catch (err) {
            telemetry_1.log.error({ giftId: gift.id, err }, '[GiftExpiry] Failed for gift');
            // Rethrow so BullMQ applies the retry/backoff policy defined above
            throw err;
        }
    }
}, {
    connection: redis_1.redis,
    // Worker-level concurrency: process one batch at a time to avoid race conditions
    concurrency: 1,
    // C-28 FIX: Job timeout enforcement - prevent stuck jobs
    lockDuration: 30000, // 30 second lock
    lockRenewTime: 5000, // Renew lock every 5 seconds
    stalledInterval: 30000, // Check for stalled jobs every 30 seconds
    maxStalledCount: 2, // Fail job after 2 stalled attempts
});
exports.giftExpiryWorker.on('stalled', (jobId) => {
    telemetry_1.log.warn({ jobId }, '[GiftExpiry] Job stalled (lock expired without renewal)');
});
// H-7 FIX: Move jobs that have exhausted all retries into the DLQ for manual review
const giftExpiryEvents = new bullmq_1.QueueEvents('gift-expiry', { connection: redis_1.redis });
giftExpiryEvents.on('failed', async ({ jobId, failedReason }) => {
    const job = await queue_1.giftExpiryQueue.getJob(jobId);
    if (!job)
        return;
    const isExhausted = (job.attemptsMade ?? 0) >= (job.opts?.attempts ?? 3);
    if (isExhausted) {
        telemetry_1.log.error({ jobId, failedReason }, '[GiftExpiry] Job exhausted retries — moving to DLQ');
        await queue_1.giftExpiryDLQ.add('dead-gift-expiry', { jobId, failedReason, jobData: job.data }, {
            removeOnComplete: false,
            removeOnFail: false,
        });
    }
});
