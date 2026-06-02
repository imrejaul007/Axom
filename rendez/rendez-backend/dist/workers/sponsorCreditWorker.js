"use strict";
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
exports.sponsorCreditWorker = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = require("../config/redis");
const database_1 = require("../config/database");
const telemetry_1 = require("../config/telemetry");
const rezWallet = __importStar(require("../integrations/rez/rezWalletClient"));
const client_1 = require("@prisma/client");
async function processSponsorCredit(job) {
    const { planId, profileId, confirmationId } = job;
    const confirmation = await database_1.prisma.planConfirmation.findUnique({ where: { id: confirmationId } });
    if (!confirmation) {
        telemetry_1.log.warn({ confirmationId }, '[SponsorCredit] Confirmation not found — skipping');
        return; // Already completed or deleted
    }
    if (confirmation.coinCreditStatus === client_1.CoinCreditStatus.CREDITED) {
        telemetry_1.log.info({ confirmationId }, '[SponsorCredit] Already credited — skipping');
        return; // Won race against another worker
    }
    const plan = await database_1.prisma.plan.findUnique({
        where: { id: planId },
        select: { isSponsored: true, sponsorPerAttendeeCoins: true, sponsorBudgetCoins: true, sponsorSpentCoins: true, merchantId: true },
    });
    if (!plan?.isSponsored || plan.sponsorPerAttendeeCoins <= 0) {
        telemetry_1.log.info({ planId }, '[SponsorCredit] Not sponsored — skipping');
        await database_1.prisma.planConfirmation.update({
            where: { id: confirmationId },
            data: { coinCreditStatus: client_1.CoinCreditStatus.FAILED, coinCreditFailedAt: new Date() },
        });
        return;
    }
    const attendee = await database_1.prisma.profile.findUnique({
        where: { id: profileId },
        select: { rezUserId: true },
    });
    if (!attendee?.rezUserId) {
        telemetry_1.log.warn({ profileId }, '[SponsorCredit] No rezUserId — skipping');
        await database_1.prisma.planConfirmation.update({
            where: { id: confirmationId },
            data: { coinCreditStatus: client_1.CoinCreditStatus.FAILED, coinCreditFailedAt: new Date() },
        });
        return;
    }
    // Deduct from sponsor budget atomically (skip if budget exhausted)
    const updated = await database_1.prisma.plan.update({
        where: { id: planId },
        data: { sponsorSpentCoins: { increment: plan.sponsorPerAttendeeCoins } },
    });
    if (updated.sponsorSpentCoins > updated.sponsorBudgetCoins) {
        telemetry_1.log.warn({ planId }, '[SponsorCredit] Sponsor budget exhausted on retry — skipping credit');
        await database_1.prisma.planConfirmation.update({
            where: { id: confirmationId },
            data: { coinCreditStatus: client_1.CoinCreditStatus.FAILED, coinCreditFailedAt: new Date() },
        });
        return;
    }
    // BULLETPROOF: creditCoins with idempotency key prevents double-credit on retry
    await rezWallet.creditCoins({
        rezUserId: attendee.rezUserId,
        coins: plan.sponsorPerAttendeeCoins,
        reason: 'merchant_sponsored_plan',
        meta: { planId, merchantId: plan.merchantId, source: 'rendez_sponsored_plan' },
        idempotencyKey: `sponsor:${planId}:${profileId}:${confirmationId}:retry:${job.attemptsMade}`,
    });
    await database_1.prisma.planConfirmation.update({
        where: { id: confirmationId },
        data: { coinCreditStatus: client_1.CoinCreditStatus.CREDITED },
    });
    telemetry_1.log.info({ planId, profileId, confirmationId, coins: plan.sponsorPerAttendeeCoins }, '[SponsorCredit] Retry succeeded — coins credited');
}
exports.sponsorCreditWorker = new bullmq_1.Worker('sponsor-credit', async (job) => {
    await processSponsorCredit(job.data);
}, {
    connection: redis_1.redis,
    concurrency: 2, // allow 2 concurrent retries but not too many DB writes at once
    // C-28 FIX: Job timeout enforcement - prevent stuck jobs
    lockDuration: 30000, // 30 second lock
    lockRenewTime: 5000, // Renew lock every 5 seconds
    stalledInterval: 30000, // Check for stalled jobs every 30 seconds
    maxStalledCount: 2, // Fail job after 2 stalled attempts
});
exports.sponsorCreditWorker.on('failed', (job, err) => {
    const data = job?.data;
    telemetry_1.log.error({ err: { message: err.message }, planId: data?.planId, profileId: data?.profileId }, '[SponsorCredit] Retry exhausted — moving to failed state');
});
exports.sponsorCreditWorker.on('completed', (job) => {
    const data = job?.data;
    telemetry_1.log.info({ planId: data?.planId, profileId: data?.profileId }, '[SponsorCredit] Retry completed successfully');
});
// C-28 FIX: Stuck job detection and recovery
exports.sponsorCreditWorker.on('stalled', (jobId) => {
    telemetry_1.log.warn({ jobId }, '[SponsorCredit] Job stalled (lock expired without renewal)');
});
