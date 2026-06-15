"use strict";
/**
 * PlanService — Sprint 11: Social Invites
 *
 * Core logic for plan creation, application, selection, confirmation,
 * ghost handling, and refund/credit flows.
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
exports.PlanService = void 0;
const database_1 = require("../config/database");
const redis_1 = require("../config/redis");
const errorHandler_1 = require("../middleware/errorHandler");
const client_1 = require("@prisma/client");
const NotificationService_1 = require("./NotificationService");
const rezBookingClient_1 = require("../integrations/rez/rezBookingClient");
const rezWallet = __importStar(require("../integrations/rez/rezWalletClient"));
const ExperienceCreditService_1 = require("./ExperienceCreditService");
const telemetry_1 = require("../config/telemetry");
const queue_1 = require("../jobs/queue");
const notif = new NotificationService_1.NotificationService();
const creditService = new ExperienceCreditService_1.ExperienceCreditService();
// ─── RANKING ─────────────────────────────────────────────────────────────────
async function computeApplicantScore(applicantId, hasNote) {
    const profile = await database_1.prisma.profile.findUnique({
        where: { id: applicantId },
        select: { isVerified: true, photos: true, bio: true, rezSpendScore: true },
    });
    if (!profile)
        return 0;
    let score = 0;
    if (hasNote)
        score += 40;
    if (profile.isVerified)
        score += 25;
    if (profile.photos.length >= 3)
        score += 15;
    if (profile.bio)
        score += 10;
    score += Math.min(profile.rezSpendScore * 5, 10); // REZ spend score (capped at 10)
    // Past meetup success rate bonus
    const meetups = await database_1.prisma.reward.count({ where: { OR: [{ user1Id: applicantId }, { user2Id: applicantId }], status: 'TRIGGERED' } });
    score += Math.min(meetups * 5, 20);
    return score;
}
// ─── PLAN SERVICE ─────────────────────────────────────────────────────────────
class PlanService {
    // ── Create ────────────────────────────────────────────────────────────────
    async createPlan(input) {
        const scheduledAt = new Date(input.scheduledAt);
        // Must be at least 12h in the future
        const minSchedule = new Date(Date.now() + 12 * 3600 * 1000);
        if (scheduledAt < minSchedule) {
            throw new errorHandler_1.AppError(400, 'Plan must be scheduled at least 12 hours from now');
        }
        // If using an experience credit, skip booking verification (credit IS the booking)
        if (!input.experienceCreditId) {
            await (0, rezBookingClient_1.verifyRezBooking)(input.rezBookingRef, input.category, input.merchantId);
        }
        const expiresAt = new Date(scheduledAt.getTime() - 4 * 3600 * 1000);
        const confirmationDeadline = new Date(scheduledAt.getTime() - 1 * 3600 * 1000);
        const isExperiencePlan = !!input.experienceCreditId;
        const plan = await database_1.prisma.plan.create({
            data: {
                organizerId: input.organizerId,
                category: input.category,
                merchantId: input.merchantId,
                merchantName: input.merchantName,
                rezBookingRef: input.rezBookingRef,
                title: input.title,
                scheduledAt,
                expiresAt,
                confirmationDeadline,
                city: input.city,
                genderPreference: input.genderPreference ?? client_1.GenderPref.ANY,
                ageMin: input.ageMin ?? 18,
                ageMax: input.ageMax ?? 60,
                visibility: input.visibility ?? client_1.PlanVisibility.PUBLIC,
                verifiedOnly: input.verifiedOnly ?? false,
                vibe: input.vibe,
                isExperiencePlan,
            },
            include: { organizer: { select: { name: true } } },
        });
        // Mark credit as used if one was provided
        if (input.experienceCreditId) {
            await creditService.markUsed(input.experienceCreditId, plan.id, input.organizerId);
        }
        return plan;
    }
    // ── Feed (filtered) ───────────────────────────────────────────────────────
    async getFeed(viewerId, params = {}) {
        const viewer = await database_1.prisma.profile.findUnique({
            where: { id: viewerId },
            select: { gender: true, age: true, city: true, isVerified: true },
        });
        if (!viewer)
            throw new errorHandler_1.AppError(404, 'Profile not found');
        const city = params.city || viewer.city;
        const now = new Date();
        const baseWhere = {
            status: client_1.PlanStatus.OPEN,
            scheduledAt: { gt: now },
            expiresAt: { gt: now },
            city,
            organizerId: { not: viewerId },
        };
        const where = params.explore
            ? baseWhere
            : {
                ...baseWhere,
                OR: [
                    { genderPreference: client_1.GenderPref.ANY },
                    { genderPreference: viewer.gender },
                ],
                ageMin: { lte: viewer.age },
                ageMax: { gte: viewer.age },
            };
        // Fetch 21 so we can determine if there's a next page without re-sorting in SQL
        const PAGE_SIZE = 20;
        const plans = await database_1.prisma.plan.findMany({
            where: {
                ...where,
                ...(params.cursor ? { createdAt: { lt: new Date(params.cursor) } } : {}),
                visibility: client_1.PlanVisibility.PUBLIC,
                // Sprint 12: verifiedOnly plans filter out unverified viewers
                ...(viewer && !viewer.isVerified ? { verifiedOnly: false } : {}),
            },
            select: {
                id: true, title: true, category: true, merchantName: true, city: true,
                scheduledAt: true, expiresAt: true, vibe: true, verifiedOnly: true,
                status: true, applicantCount: true, viewsCount: true, boostedUntil: true,
                isSponsored: true, sponsorPerAttendeeCoins: true, sponsorBudgetCoins: true,
                organizer: { select: { id: true, name: true, photos: true, isVerified: true, age: true, gender: true, responseRate: true, meetupCount: true } },
            },
            orderBy: [{ boostedUntil: 'desc' }, { applicantCount: 'desc' }, { scheduledAt: 'asc' }],
            take: PAGE_SIZE + 1,
        });
        // Sprint 12: Women organizer 2× boost — re-sort after fetch
        // Safety-first: female organizers get top visibility in plans feed
        const boosted = plans
            .map((p) => ({
            ...p,
            _feedScore: p.organizer.gender === 'FEMALE' ? 2 : 1,
        }))
            .sort((a, b) => {
            if (b._feedScore !== a._feedScore)
                return b._feedScore - a._feedScore;
            if (a.boostedUntil && b.boostedUntil)
                return 0;
            if (a.boostedUntil)
                return -1;
            if (b.boostedUntil)
                return 1;
            return b.applicantCount - a.applicantCount;
        });
        // RD-M-18 FIX: Return nextCursor so clients can paginate deterministically.
        // Fetched PAGE_SIZE+1 to determine if there's a next page.
        // Cursor is based on scheduledAt (the primary sort key) encoded as ISO string.
        const hasMore = boosted.length > PAGE_SIZE;
        const result = hasMore ? boosted.slice(0, PAGE_SIZE) : boosted;
        const nextCursor = hasMore ? result[result.length - 1]?.scheduledAt.toISOString() : undefined;
        const cleaned = result.map(({ _feedScore, ...rest }) => rest);
        // Increment viewsCount in background
        const ids = cleaned.map((p) => p.id);
        if (ids.length) {
            database_1.prisma.plan.updateMany({ where: { id: { in: ids } }, data: { viewsCount: { increment: 1 } } }).catch((err) => {
                telemetry_1.log.error({ err, ids }, '[PlanService] Failed to increment viewsCount');
            });
        }
        return { plans: cleaned, nextCursor };
    }
    // ── Detail ────────────────────────────────────────────────────────────────
    async getPlan(planId, viewerId) {
        const plan = await database_1.prisma.plan.findUnique({
            where: { id: planId },
            select: {
                id: true, title: true, category: true, merchantName: true, merchantId: true, city: true,
                scheduledAt: true, expiresAt: true, confirmationDeadline: true, vibe: true,
                verifiedOnly: true, status: true, applicantCount: true, viewsCount: true,
                isSponsored: true, sponsorPerAttendeeCoins: true, sponsorBudgetCoins: true, sponsorSpentCoins: true,
                organizer: { select: { id: true, name: true, photos: true, isVerified: true, age: true, city: true } },
                confirmations: true,
                applications: {
                    where: { applicantId: viewerId },
                    select: { status: true, note: true },
                },
            },
        });
        if (!plan)
            throw new errorHandler_1.AppError(404, 'Plan not found');
        // Increment view count
        database_1.prisma.plan.update({ where: { id: planId }, data: { viewsCount: { increment: 1 } } }).catch((err) => {
            telemetry_1.log.error({ err, planId }, '[PlanService] Failed to increment viewsCount');
        });
        return plan;
    }
    // ── Apply ─────────────────────────────────────────────────────────────────
    async applyToPlan(planId, applicantId, note) {
        const plan = await database_1.prisma.plan.findUnique({ where: { id: planId } });
        if (!plan)
            throw new errorHandler_1.AppError(404, 'Plan not found');
        if (plan.status !== client_1.PlanStatus.OPEN)
            throw new errorHandler_1.AppError(409, 'Plan is no longer accepting applications');
        if (plan.organizerId === applicantId)
            throw new errorHandler_1.AppError(400, 'Cannot apply to your own plan');
        if (new Date() > plan.expiresAt)
            throw new errorHandler_1.AppError(409, 'Applications for this plan have closed');
        if (plan.verifiedOnly) {
            const profile = await database_1.prisma.profile.findUnique({ where: { id: applicantId }, select: { isVerified: true } });
            if (!profile?.isVerified)
                throw new errorHandler_1.AppError(403, 'This plan is restricted to verified users');
        }
        // Rate limit: max 10 active applications per user
        const activeCount = await database_1.prisma.planApplication.count({
            where: { applicantId, status: client_1.ApplicationStatus.PENDING },
        });
        if (activeCount >= 10)
            throw new errorHandler_1.AppError(429, 'You have too many active applications (max 10)');
        const score = await computeApplicantScore(applicantId, !!note?.trim());
        const application = await database_1.prisma.planApplication.create({
            data: { planId, applicantId, note: note?.trim(), score },
        });
        // Increment applicantCount
        await database_1.prisma.plan.update({ where: { id: planId }, data: { applicantCount: { increment: 1 } } });
        // Notify organizer
        const [organizerTokenRaw, applicantProfile] = await Promise.all([
            redis_1.redis.get(`fcm:${plan.organizerId}`),
            database_1.prisma.profile.findUnique({ where: { id: applicantId }, select: { name: true } }),
        ]);
        const organizerToken = organizerTokenRaw ? JSON.parse(organizerTokenRaw).fcmToken : null;
        if (organizerToken && applicantProfile) {
            notif.planApplied(organizerToken, applicantProfile.name, plan.title, planId).catch((err) => {
                telemetry_1.log.error({ err, planId, applicantId }, '[PlanService] planApplied notification failed');
            });
        }
        return application;
    }
    // ── Withdraw ──────────────────────────────────────────────────────────────
    async withdrawApplication(planId, applicantId) {
        const app = await database_1.prisma.planApplication.findUnique({
            where: { planId_applicantId: { planId, applicantId } },
        });
        if (!app)
            throw new errorHandler_1.AppError(404, 'Application not found');
        if (app.status !== client_1.ApplicationStatus.PENDING)
            throw new errorHandler_1.AppError(409, 'Cannot withdraw — application is not pending');
        await database_1.prisma.planApplication.update({
            where: { planId_applicantId: { planId, applicantId } },
            data: { status: client_1.ApplicationStatus.WITHDRAWN },
        });
        await database_1.prisma.plan.update({ where: { id: planId }, data: { applicantCount: { decrement: 1 } } });
    }
    // ── Get Applications (organizer) ──────────────────────────────────────────
    async getApplications(planId, organizerId) {
        const plan = await database_1.prisma.plan.findUnique({ where: { id: planId } });
        if (!plan)
            throw new errorHandler_1.AppError(404, 'Plan not found');
        if (plan.organizerId !== organizerId)
            throw new errorHandler_1.AppError(403, 'Not your plan');
        return database_1.prisma.planApplication.findMany({
            where: { planId, status: { in: [client_1.ApplicationStatus.PENDING, client_1.ApplicationStatus.SELECTED] } },
            include: {
                applicant: {
                    select: { id: true, name: true, photos: true, age: true, city: true, isVerified: true, bio: true },
                },
            },
            orderBy: { score: 'desc' }, // ranked by score
        });
    }
    // ── Select Applicant ──────────────────────────────────────────────────────
    async selectApplicant(planId, organizerId, applicantId) {
        // DB transaction with row lock — prevents double-selection
        return database_1.prisma.$transaction(async (tx) => {
            const plan = await tx.plan.findUnique({ where: { id: planId } });
            if (!plan)
                throw new errorHandler_1.AppError(404, 'Plan not found');
            if (plan.organizerId !== organizerId)
                throw new errorHandler_1.AppError(403, 'Not your plan');
            if (plan.status !== client_1.PlanStatus.OPEN)
                throw new errorHandler_1.AppError(409, 'Plan is no longer open for selection');
            if (plan.reselectionCount > plan.maxReselections)
                throw new errorHandler_1.AppError(409, 'Maximum reselections reached');
            const application = await tx.planApplication.findUnique({
                where: { planId_applicantId: { planId, applicantId } },
            });
            if (!application || application.status !== client_1.ApplicationStatus.PENDING) {
                throw new errorHandler_1.AppError(404, 'Application not found or already processed');
            }
            // Mark selected
            await tx.planApplication.update({
                where: { planId_applicantId: { planId, applicantId } },
                data: { status: client_1.ApplicationStatus.SELECTED, selectedAt: new Date() },
            });
            // Reject all other pending applications
            await tx.planApplication.updateMany({
                where: { planId, status: client_1.ApplicationStatus.PENDING, applicantId: { not: applicantId } },
                data: { status: client_1.ApplicationStatus.REJECTED },
            });
            // Create or reuse Match and force chat OPEN
            const [uid1, uid2] = [organizerId, applicantId].sort();
            let match = await tx.match.findUnique({
                where: { user1Id_user2Id: { user1Id: uid1, user2Id: uid2 } },
                include: { messageState: true },
            });
            if (!match) {
                match = await tx.match.create({
                    data: {
                        user1Id: uid1,
                        user2Id: uid2,
                        intentType: 'DATING',
                        messageState: { create: { state: client_1.ChatState.OPEN } },
                    },
                    include: { messageState: true },
                });
            }
            else {
                // Force existing chat to OPEN regardless of prior state
                await tx.messageState.update({
                    where: { matchId: match.id },
                    data: { state: client_1.ChatState.OPEN, lastActivityAt: new Date(), expiresAt: null },
                });
            }
            // Update plan: FILLED + store matchId
            await tx.plan.update({
                where: { id: planId },
                data: { status: client_1.PlanStatus.FILLED, matchId: match.id },
            });
            // Notify selected applicant
            const [applicantTokenRaw, organizerProfile] = await Promise.all([
                redis_1.redis.get(`fcm:${applicantId}`),
                tx.profile.findUnique({ where: { id: organizerId }, select: { name: true } }),
            ]);
            const applicantToken = applicantTokenRaw ? JSON.parse(applicantTokenRaw).fcmToken : null;
            if (applicantToken && organizerProfile) {
                notif.planSelected(applicantToken, organizerProfile.name, plan.title, match.id).catch((err) => {
                    telemetry_1.log.warn({ err }, '[PlanService] planSelected notification failed');
                });
            }
            return { matchId: match.id, planId };
        });
    }
    // ── Confirm Attendance ────────────────────────────────────────────────────
    async confirmAttendance(planId, profileId) {
        const plan = await database_1.prisma.plan.findUnique({ where: { id: planId } });
        if (!plan)
            throw new errorHandler_1.AppError(404, 'Plan not found');
        if (plan.status !== client_1.PlanStatus.FILLED)
            throw new errorHandler_1.AppError(409, 'Plan not in a confirmable state');
        if (new Date() > plan.confirmationDeadline)
            throw new errorHandler_1.AppError(409, 'Confirmation deadline has passed');
        // Upsert confirmation record with coinCreditStatus=PENDING so retries are trackable
        const confirmation = await database_1.prisma.planConfirmation.upsert({
            where: { planId_profileId: { planId, profileId } },
            create: { planId, profileId, coinCreditStatus: client_1.CoinCreditStatus.PENDING },
            update: {},
        });
        // BULLETPROOF: If already credited, return immediately — no double-credit
        if (confirmation.coinCreditStatus === client_1.CoinCreditStatus.CREDITED) {
            return { confirmed: true, coinsCredited: true };
        }
        // BULLETPROOF: If previously failed and already retried twice, give up
        if (confirmation.coinCreditStatus === client_1.CoinCreditStatus.FAILED &&
            confirmation.coinCreditAttempts >= 2) {
            telemetry_1.log.warn({ planId, profileId, attempts: confirmation.coinCreditAttempts }, '[PlanService] Sponsor credit permanently failed after max retries');
            return { confirmed: true, coinsCredited: false };
        }
        // BULLETPROOF: Redis NX lock prevents concurrent credit attempts for same (plan, profile)
        const lockKey = `sponsor_credit:${planId}:${profileId}`;
        const lock = await redis_1.redis.set(lockKey, '1', 'EX', 86400, 'NX');
        if (!lock) {
            // Another process is handling the credit — return confirmed without blocking
            return { confirmed: true, coinsCredited: false };
        }
        try {
            const attendee = await database_1.prisma.profile.findUnique({
                where: { id: profileId },
                select: { rezUserId: true },
            });
            if (!attendee?.rezUserId) {
                // No REZ account linked — can't credit, mark as failed
                await database_1.prisma.planConfirmation.update({
                    where: { id: confirmation.id },
                    data: { coinCreditStatus: client_1.CoinCreditStatus.FAILED, coinCreditFailedAt: new Date() },
                });
                return { confirmed: true, coinsCredited: false };
            }
            // Deduct from sponsor budget atomically
            const updated = await database_1.prisma.plan.update({
                where: { id: planId },
                data: { sponsorSpentCoins: { increment: plan.sponsorPerAttendeeCoins } },
            });
            // Stop crediting once budget exhausted
            if (updated.sponsorSpentCoins > updated.sponsorBudgetCoins) {
                telemetry_1.log.warn({ planId, profileId }, '[PlanService] Sponsor budget exhausted — skipping credit');
                await database_1.prisma.planConfirmation.update({
                    where: { id: confirmation.id },
                    data: { coinCreditStatus: client_1.CoinCreditStatus.FAILED, coinCreditFailedAt: new Date() },
                });
                return { confirmed: true, coinsCredited: false };
            }
            // BULLETPROOF: creditCoins with idempotency key prevents double-credit on retry
            await rezWallet.creditCoins({
                rezUserId: attendee.rezUserId,
                coins: plan.sponsorPerAttendeeCoins,
                reason: 'merchant_sponsored_plan',
                meta: { planId, merchantId: plan.merchantId, source: 'rendez_sponsored_plan' },
                idempotencyKey: `sponsor:${planId}:${profileId}:${confirmation.id}`,
            });
            // Mark as credited
            await database_1.prisma.planConfirmation.update({
                where: { id: confirmation.id },
                data: { coinCreditStatus: client_1.CoinCreditStatus.CREDITED },
            });
            telemetry_1.log.info({ planId, profileId, coins: plan.sponsorPerAttendeeCoins }, '[PlanService] Sponsor coins credited to attendee');
        }
        catch (err) {
            // BULLETPROOF: On failure, increment attempt counter and enqueue retry job.
            // The caller still gets confirmed=true — we don't block attendance for a financial failure.
            await database_1.prisma.planConfirmation.update({
                where: { id: confirmation.id },
                data: {
                    coinCreditStatus: client_1.CoinCreditStatus.FAILED,
                    coinCreditFailedAt: new Date(),
                    coinCreditAttempts: { increment: 1 },
                },
            });
            telemetry_1.log.error({ err, planId, profileId }, '[PlanService] Sponsor credit failed — enqueuing retry');
            // Enqueue retry job (3 attempts with exponential backoff via queue)
            await queue_1.sponsorCreditQueue.add('retry-sponsor-credit', { planId, profileId, confirmationId: confirmation.id }, { attempts: 3, backoff: { type: 'exponential', delay: 10000 }, removeOnFail: false });
        }
        return { confirmed: true, coinsCredited: false };
    }
    // ── Cancel Plan (organizer) ───────────────────────────────────────────────
    async cancelPlan(planId, organizerId) {
        const plan = await database_1.prisma.plan.findUnique({
            where: { id: planId },
            include: { applications: { where: { status: { in: [client_1.ApplicationStatus.PENDING, client_1.ApplicationStatus.SELECTED] } } } },
        });
        if (!plan)
            throw new errorHandler_1.AppError(404, 'Plan not found');
        if (plan.organizerId !== organizerId)
            throw new errorHandler_1.AppError(403, 'Not your plan');
        if (!['OPEN', 'FILLED'].includes(plan.status))
            throw new errorHandler_1.AppError(409, 'Plan cannot be cancelled in its current state');
        await database_1.prisma.plan.update({ where: { id: planId }, data: { status: client_1.PlanStatus.CANCELLED } });
        const hadApplicants = plan.applications.length > 0;
        await this._handleCancellationRefund(plan.rezBookingRef, hadApplicants, plan.organizerId);
        return { cancelled: true };
    }
    // ── Reselect (after ghost) ────────────────────────────────────────────────
    async reselect(planId, organizerId, newApplicantId) {
        const plan = await database_1.prisma.plan.findUnique({ where: { id: planId } });
        if (!plan)
            throw new errorHandler_1.AppError(404, 'Plan not found');
        if (plan.organizerId !== organizerId)
            throw new errorHandler_1.AppError(403, 'Not your plan');
        if (plan.reselectionCount >= plan.maxReselections)
            throw new errorHandler_1.AppError(409, 'Maximum reselections reached — plan will be cancelled');
        // Bump reselection count, reopen plan
        await database_1.prisma.$transaction(async (tx) => {
            await tx.plan.update({
                where: { id: planId },
                data: { status: client_1.PlanStatus.OPEN, reselectionCount: { increment: 1 }, matchId: null },
            });
            // Reset previously selected application back to PENDING
            await tx.planApplication.updateMany({
                where: { planId, status: client_1.ApplicationStatus.SELECTED },
                data: { status: client_1.ApplicationStatus.REJECTED },
            });
            // Restore rejected applications to PENDING so organizer can pick again
            await tx.planApplication.updateMany({
                where: { planId, status: client_1.ApplicationStatus.REJECTED, applicantId: newApplicantId },
                data: { status: client_1.ApplicationStatus.PENDING },
            });
        });
        return this.selectApplicant(planId, organizerId, newApplicantId);
    }
    // ── My Plans ──────────────────────────────────────────────────────────────
    async getMyPlans(profileId) {
        const [organized, applied] = await Promise.all([
            database_1.prisma.plan.findMany({
                where: { organizerId: profileId },
                include: { applications: { select: { status: true } } },
                orderBy: { scheduledAt: 'desc' },
                take: 20,
            }),
            database_1.prisma.planApplication.findMany({
                where: { applicantId: profileId },
                include: {
                    plan: {
                        include: { organizer: { select: { id: true, name: true, photos: true } } },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: 20,
            }),
        ]);
        return { organized, applied };
    }
    // ── Refund Logic ──────────────────────────────────────────────────────────
    async _handleCancellationRefund(rezBookingRef, hadApplicants, organizerId) {
        try {
            if (!hadApplicants) {
                // Full refund
                await rezWallet.refundBooking(rezBookingRef, 'no_applicants');
            }
            else {
                // Issue REZ locked credit — must use rezUserId (REZ system ID), not Rendez profile ID
                const organizer = await database_1.prisma.profile.findUnique({
                    where: { id: organizerId },
                    select: { rezUserId: true },
                });
                if (!organizer?.rezUserId) {
                    telemetry_1.log.error({ organizerId, rezBookingRef }, '[PlanService] Cannot issue credit — organizer has no rezUserId');
                    return;
                }
                await rezWallet.issuePlanCredit(organizer.rezUserId, rezBookingRef, 7);
            }
        }
        catch (err) {
            telemetry_1.log.error({ rezBookingRef, err }, '[PlanService] Refund failed for booking');
        }
    }
}
exports.PlanService = PlanService;
