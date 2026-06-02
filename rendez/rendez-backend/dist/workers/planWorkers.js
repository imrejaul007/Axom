"use strict";
/**
 * Plan background workers — Sprint 11
 *
 * planExpiryWorker    — every 10 min: expire OPEN plans past their expiresAt
 * ghostDetectWorker   — every 15 min: flag FILLED plans where selected user hasn't confirmed in 6h
 * autoCancelWorker    — every 30 min: cancel plans that have hit max reselections with no confirmation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoCancelWorker = exports.ghostDetectWorker = exports.planExpiryWorker = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = require("../config/redis");
const telemetry_1 = require("../config/telemetry");
const database_1 = require("../config/database");
const client_1 = require("@prisma/client");
const PlanService_1 = require("../services/PlanService");
const NotificationService_1 = require("../services/NotificationService");
// Queue instances are owned by jobs/queue.ts — import from there to avoid duplicate Redis connections
const planService = new PlanService_1.PlanService();
const notif = new NotificationService_1.NotificationService();
// ─── Plan Expiry ──────────────────────────────────────────────────────────────
// Closes applications on OPEN plans whose expiresAt has passed.
// If zero applicants → full refund. Otherwise → REZ locked credit.
exports.planExpiryWorker = new bullmq_1.Worker('plan-expiry', async () => {
    const expiredPlans = await database_1.prisma.plan.findMany({
        where: { status: client_1.PlanStatus.OPEN, expiresAt: { lte: new Date() } },
    });
    for (const plan of expiredPlans) {
        try {
            await database_1.prisma.plan.update({ where: { id: plan.id }, data: { status: client_1.PlanStatus.EXPIRED } });
            const hadApplicants = plan.applicantCount > 0;
            await planService
                ._handleCancellationRefund(plan.rezBookingRef, hadApplicants, plan.organizerId);
            // Notify organizer
            const tokenRaw = await redis_1.redis.get(`fcm:${plan.organizerId}`);
            const token = tokenRaw ? JSON.parse(tokenRaw).fcmToken : null;
            if (token) {
                notif.planExpired(token, plan.title, hadApplicants).catch((err) => {
                    telemetry_1.log.error({ err, planId: plan.id }, '[PlanExpiry] planExpired notification failed');
                });
            }
        }
        catch (err) {
            telemetry_1.log.error({ planId: plan.id, err }, '[PlanExpiry] Failed for plan');
        }
    }
}, {
    connection: redis_1.redis,
    // C-28 FIX: Job timeout enforcement - prevent stuck jobs
    lockDuration: 30000, // 30 second lock
    lockRenewTime: 5000, // Renew lock every 5 seconds
    stalledInterval: 30000, // Check for stalled jobs every 30 seconds
    maxStalledCount: 2, // Fail job after 2 stalled attempts
});
exports.planExpiryWorker.on('stalled', (jobId) => {
    telemetry_1.log.warn({ jobId }, '[PlanExpiry] Job stalled (lock expired without renewal)');
});
// ─── Ghost Detection ──────────────────────────────────────────────────────────
// Detects FILLED plans where selected applicant hasn't confirmed within 6h.
exports.ghostDetectWorker = new bullmq_1.Worker('plan-ghost', async () => {
    const sixHoursAgo = new Date(Date.now() - 6 * 3600 * 1000);
    const filledPlans = await database_1.prisma.plan.findMany({
        where: {
            status: client_1.PlanStatus.FILLED,
            scheduledAt: { gt: new Date() },
            updatedAt: { lte: sixHoursAgo },
        },
        include: {
            applications: {
                where: { status: client_1.ApplicationStatus.SELECTED },
                include: { applicant: { select: { id: true, name: true } } },
            },
            confirmations: true,
        },
    });
    for (const plan of filledPlans) {
        try {
            const selected = plan.applications[0];
            if (!selected)
                continue;
            const hasConfirmed = plan.confirmations.some((c) => c.profileId === selected.applicantId);
            if (hasConfirmed)
                continue;
            // Flag ghost — notify organizer to reselect
            const tokenRaw = await redis_1.redis.get(`fcm:${plan.organizerId}`);
            const token = tokenRaw ? JSON.parse(tokenRaw).fcmToken : null;
            if (token) {
                notif.planGhostAlert(token, selected.applicant.name, plan.title, plan.id).catch((err) => {
                    telemetry_1.log.error({ err, planId: plan.id }, '[GhostDetect] planGhostAlert notification failed');
                });
            }
        }
        catch (err) {
            telemetry_1.log.error({ planId: plan.id, err }, '[GhostDetect] Failed for plan');
            throw err; // re-throw so BullMQ can retry
        }
    }
}, {
    connection: redis_1.redis,
    // C-28 FIX: Job timeout enforcement - prevent stuck jobs
    lockDuration: 30000, // 30 second lock
    lockRenewTime: 5000, // Renew lock every 5 seconds
    stalledInterval: 30000, // Check for stalled jobs every 30 seconds
    maxStalledCount: 2, // Fail job after 2 stalled attempts
});
exports.ghostDetectWorker.on('stalled', (jobId) => {
    telemetry_1.log.warn({ jobId }, '[GhostDetect] Job stalled (lock expired without renewal)');
});
// ─── Auto Cancel ──────────────────────────────────────────────────────────────
// If plan is FILLED, confirmation deadline has passed, and no confirmations → NO_SHOW.
// Issues locked REZ credit.
exports.autoCancelWorker = new bullmq_1.Worker('plan-cancel', async () => {
    const noShowPlans = await database_1.prisma.plan.findMany({
        where: {
            status: client_1.PlanStatus.FILLED,
            confirmationDeadline: { lte: new Date() },
        },
        include: { confirmations: true },
    });
    for (const plan of noShowPlans) {
        try {
            if (plan.confirmations.length < 2) {
                await database_1.prisma.plan.update({ where: { id: plan.id }, data: { status: client_1.PlanStatus.NO_SHOW } });
                // Issue locked credit regardless (both parties failed to confirm)
                await planService
                    ._handleCancellationRefund(plan.rezBookingRef, true, plan.organizerId);
            }
            else {
                // Both confirmed — mark completed (actual meetup validation via QR is separate)
                await database_1.prisma.plan.update({ where: { id: plan.id }, data: { status: client_1.PlanStatus.COMPLETED } });
            }
        }
        catch (err) {
            telemetry_1.log.error({ planId: plan.id, err }, '[AutoCancel] Failed for plan');
            throw err; // re-throw so BullMQ can retry
        }
    }
}, {
    connection: redis_1.redis,
    // C-28 FIX: Job timeout enforcement - prevent stuck jobs
    lockDuration: 30000, // 30 second lock
    lockRenewTime: 5000, // Renew lock every 5 seconds
    stalledInterval: 30000, // Check for stalled jobs every 30 seconds
    maxStalledCount: 2, // Fail job after 2 stalled attempts
});
exports.autoCancelWorker.on('stalled', (jobId) => {
    telemetry_1.log.warn({ jobId }, '[AutoCancel] Job stalled (lock expired without renewal)');
});
