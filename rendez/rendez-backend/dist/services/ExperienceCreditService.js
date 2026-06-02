"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExperienceCreditService = void 0;
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const telemetry_1 = require("../config/telemetry");
class ExperienceCreditService {
    // Called by the partner webhook from REZ backend
    async grant(params) {
        // Find profile by rezUserId
        const profile = await database_1.prisma.profile.findUnique({ where: { rezUserId: params.rezUserId } });
        if (!profile)
            throw new errorHandler_1.AppError(404, 'Profile not found for this REZ user');
        // Idempotent — return existing if already granted
        const existing = await database_1.prisma.experienceCredit.findUnique({ where: { rezRewardId: params.rezRewardId } });
        if (existing)
            return existing;
        const credit = await database_1.prisma.experienceCredit.create({
            data: {
                profileId: profile.id,
                rezUserId: params.rezUserId,
                rezRewardId: params.rezRewardId,
                tier: params.tier,
                type: params.type,
                label: params.label,
                expiresAt: params.expiresAt,
            },
        });
        return credit;
    }
    // Get all available credits for a user
    async getAvailable(profileId) {
        return database_1.prisma.experienceCredit.findMany({
            where: { profileId, status: 'AVAILABLE', expiresAt: { gt: new Date() } },
            orderBy: { grantedAt: 'desc' },
        });
    }
    // Get all credits (for wallet screen)
    async getAll(profileId) {
        return database_1.prisma.experienceCredit.findMany({
            where: { profileId },
            orderBy: { grantedAt: 'desc' },
        });
    }
    // Mark credit as used when a Plan is created with it
    // Called inside PlanService.createPlan
    async markUsed(creditId, planId, profileId) {
        // Atomic updateMany with all conditions in the WHERE clause — eliminates TOCTOU
        // race where two concurrent plan-creation requests both read status=AVAILABLE
        // and both proceed to update, effectively using one credit twice.
        const updated = await database_1.prisma.experienceCredit.updateMany({
            where: { id: creditId, profileId, status: 'AVAILABLE', expiresAt: { gt: new Date() } },
            data: { status: 'USED', usedInPlanId: planId },
        });
        if (updated.count === 0) {
            // Re-fetch to give a more specific error message
            const credit = await database_1.prisma.experienceCredit.findFirst({ where: { id: creditId, profileId } });
            if (!credit)
                throw new errorHandler_1.AppError(400, 'Credit not found');
            if (credit.expiresAt < new Date())
                throw new errorHandler_1.AppError(400, 'Credit has expired');
            throw new errorHandler_1.AppError(400, 'Credit not available or already used');
        }
        const credit = await database_1.prisma.experienceCredit.findUnique({ where: { id: creditId } });
        // Notify REZ backend (fire-and-forget but logged)
        this._notifyRezUsed(creditId).catch((err) => {
            telemetry_1.log.error({ err, creditId }, '[ExperienceCreditService] _notifyRezUsed failed');
        });
        return credit;
    }
    async _notifyRezUsed(rendezCreditId) {
        // CS-CRIT-07 FIX: Fail at call time if env vars are missing — prevents
        // HMAC being computed with an empty key (REZ silently rejects, double-spend risk).
        const rezBackendUrl = process.env.REZ_BACKEND_URL;
        if (!rezBackendUrl) {
            throw new Error('[ExperienceCreditService] REZ_BACKEND_URL env var is not configured');
        }
        const secret = process.env.RENDEZ_WEBHOOK_SECRET;
        if (!secret) {
            throw new Error('[ExperienceCreditService] RENDEZ_WEBHOOK_SECRET env var is not configured — cannot sign webhook');
        }
        const body = JSON.stringify({ rendezCreditId, event: 'credit.used' });
        const sig = `sha256=${require('crypto').createHmac('sha256', secret).update(body).digest('hex')}`;
        const url = `${rezBackendUrl}/api/experience-rewards/webhook/used`;
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-rendez-signature': sig },
            body,
        });
    }
    // Expire stale credits (run daily)
    async expireStale() {
        await database_1.prisma.experienceCredit.updateMany({
            where: { status: 'AVAILABLE', expiresAt: { lt: new Date() } },
            data: { status: 'EXPIRED' },
        });
    }
}
exports.ExperienceCreditService = ExperienceCreditService;
