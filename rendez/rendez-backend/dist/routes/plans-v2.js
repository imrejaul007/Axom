"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const telemetry_1 = require("../config/telemetry");
const router = (0, express_1.Router)();
// Validation schemas
const createPlanSchema = zod_1.z.object({
    title: zod_1.z.string().min(3).max(100),
    description: zod_1.z.string().max(500).optional(),
    category: zod_1.z.enum(['DINING', 'SPORTS', 'OUTDOOR', 'WELLNESS', 'SOCIAL']),
    date: zod_1.z.string().datetime(),
    location: zod_1.z.string().min(3),
    latitude: zod_1.z.number().optional(),
    longitude: zod_1.z.number().optional(),
    totalSlots: zod_1.z.number().min(2).max(10).default(2),
    mode: zod_1.z.enum(['BOOK_FIRST', 'MATCH_FIRST']).default('MATCH_FIRST'),
    isBooked: zod_1.z.boolean().default(false),
    bookingId: zod_1.z.string().optional(),
    minKarma: zod_1.z.number().min(0).max(100).optional(),
    genderPreference: zod_1.z.enum(['MALE', 'FEMALE', 'ANY']).optional(),
});
const applySchema = zod_1.z.object({
    message: zod_1.z.string().max(200).optional(),
});
// Create Plan
router.post('/', auth_1.rendezAuth, async (req, res, next) => {
    try {
        const data = createPlanSchema.parse(req.body);
        const user = req.user;
        // Get user profile for karma check
        const profile = await database_1.prisma.profile.findUnique({
            where: { id: user.id },
            select: { karmaScore: true },
        });
        // Check karma requirement
        if (data.minKarma && (profile?.karmaScore ?? 0) < data.minKarma) {
            return res.status(403).json({
                success: false,
                error: { code: 'KARMA_LOW', message: 'Karma score too low for this plan' }
            });
        }
        // Create plan
        const plan = await database_1.prisma.plan.create({
            data: {
                title: data.title,
                category: mapCategoryToPrisma(data.category),
                scheduledAt: new Date(data.date),
                expiresAt: new Date(data.date),
                confirmationDeadline: new Date(data.date),
                merchantId: data.bookingId || 'direct',
                merchantName: data.location,
                rezBookingRef: data.bookingId || `direct-${Date.now()}`,
                organizerId: user.id,
                city: 'default',
                genderPreference: mapGenderPref(data.genderPreference),
                capacity: data.totalSlots,
                status: 'OPEN',
            },
            include: {
                organizer: {
                    select: { id: true, name: true, karmaScore: true, meetupCount: true }
                }
            }
        });
        // Auto-approve organizer as participant
        await database_1.prisma.planApplication.create({
            data: {
                planId: plan.id,
                applicantId: user.id,
                status: 'SELECTED',
                selectedAt: new Date(),
            }
        });
        // Increment plans created counter
        await database_1.prisma.profile.update({
            where: { id: user.id },
            data: { meetupCount: { increment: 1 } }
        });
        res.status(201).json({ success: true, data: plan });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: error.errors }
            });
        }
        telemetry_1.log.error({ error }, '[PlansV2] Failed to create plan');
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR' } });
    }
});
// Get Plans Feed
router.get('/', auth_1.rendezAuth, rateLimiter_1.defaultLimiter, async (req, res, next) => {
    try {
        const { category, mode, limit = 20, offset = 0 } = req.query;
        const where = {
            status: 'OPEN',
            scheduledAt: { gte: new Date() }, // Only future plans
        };
        if (category)
            where.category = category;
        // Get user's plan applications to exclude
        const myApplications = await database_1.prisma.planApplication.findMany({
            where: { applicantId: req.user.id },
            select: { planId: true }
        }).then(p => p.map(x => x.planId));
        where.id = { notIn: myApplications };
        const plans = await database_1.prisma.plan.findMany({
            where,
            include: {
                organizer: {
                    select: { id: true, name: true, karmaScore: true, meetupCount: true, photos: true }
                },
                _count: { select: { applications: true } }
            },
            orderBy: [
                { isSponsored: 'desc' }, // Sponsored plans first
                { scheduledAt: 'asc' }
            ],
            take: Number(limit),
            skip: Number(offset),
        });
        res.json({ success: true, data: plans });
    }
    catch (error) {
        telemetry_1.log.error({ error }, '[PlansV2] Failed to get plans feed');
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR' } });
    }
});
// Get Plan by ID
router.get('/:planId', auth_1.rendezAuth, async (req, res, next) => {
    try {
        const { planId } = req.params;
        const plan = await database_1.prisma.plan.findUnique({
            where: { id: planId },
            include: {
                organizer: {
                    select: { id: true, name: true, karmaScore: true, meetupCount: true, photos: true }
                },
                applications: {
                    include: {
                        applicant: { select: { id: true, name: true, karmaScore: true, photos: true } }
                    }
                },
                _count: { select: { applications: true } }
            },
        });
        if (!plan) {
            return res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Plan not found' }
            });
        }
        res.json({ success: true, data: plan });
    }
    catch (error) {
        telemetry_1.log.error({ error }, '[PlansV2] Failed to get plan');
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR' } });
    }
});
// Apply to Plan
router.post('/:planId/apply', auth_1.rendezAuth, rateLimiter_1.planApplyLimiter, async (req, res, next) => {
    try {
        const { planId } = req.params;
        const { message } = applySchema.parse(req.body || {});
        const userId = req.user.id;
        // Check plan exists
        const plan = await database_1.prisma.plan.findUnique({
            where: { id: planId },
            include: { _count: { select: { applications: true } } }
        });
        if (!plan) {
            return res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Plan not found' }
            });
        }
        if (plan.status !== 'OPEN') {
            return res.status(400).json({
                success: false,
                error: { code: 'PLAN_CLOSED', message: 'This plan is no longer accepting applications' }
            });
        }
        // Get user profile for karma check
        const profile = await database_1.prisma.profile.findUnique({
            where: { id: userId },
            select: { karmaScore: true },
        });
        // Check karma requirement
        if (plan.applicantCount && (profile?.karmaScore ?? 0) < plan.applicantCount) {
            return res.status(403).json({
                success: false,
                error: { code: 'KARMA_LOW', message: 'Karma score too low for this plan' }
            });
        }
        // Check not already applied
        const existing = await database_1.prisma.planApplication.findUnique({
            where: { planId_applicantId: { planId, applicantId: userId } }
        });
        if (existing) {
            return res.status(400).json({
                success: false,
                error: { code: 'ALREADY_APPLIED', message: 'You have already applied to this plan' }
            });
        }
        // Create application
        const application = await database_1.prisma.planApplication.create({
            data: {
                planId,
                applicantId: userId,
                note: message,
                status: 'PENDING',
            }
        });
        // Update applicant count
        await database_1.prisma.plan.update({
            where: { id: planId },
            data: { applicantCount: { increment: 1 } }
        });
        res.status(201).json({ success: true, data: application });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: error.errors }
            });
        }
        telemetry_1.log.error({ error }, '[PlansV2] Failed to apply to plan');
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR' } });
    }
});
// Get Applications for a Plan (organizer only)
router.get('/:planId/applications', auth_1.rendezAuth, async (req, res, next) => {
    try {
        const { planId } = req.params;
        const userId = req.user.id;
        const plan = await database_1.prisma.plan.findUnique({
            where: { id: planId },
            select: { organizerId: true }
        });
        if (!plan) {
            return res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Plan not found' }
            });
        }
        if (plan.organizerId !== userId) {
            return res.status(403).json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'Only the organizer can view applications' }
            });
        }
        const applications = await database_1.prisma.planApplication.findMany({
            where: { planId },
            include: {
                applicant: {
                    select: { id: true, name: true, karmaScore: true, meetupCount: true, photos: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data: applications });
    }
    catch (error) {
        telemetry_1.log.error({ error }, '[PlansV2] Failed to get applications');
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR' } });
    }
});
// Approve/Reject Applicant
router.post('/:planId/participants/:participantId', auth_1.rendezAuth, async (req, res, next) => {
    try {
        const { planId, participantId } = req.params;
        const { action } = req.body; // APPROVE or REJECT
        const userId = req.user.id;
        const plan = await database_1.prisma.plan.findUnique({
            where: { id: planId },
            include: { applications: true }
        });
        if (!plan || plan.organizerId !== userId) {
            return res.status(403).json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'Only the organizer can manage participants' }
            });
        }
        if (action === 'APPROVE') {
            // Update application status
            await database_1.prisma.planApplication.update({
                where: { planId_applicantId: { planId, applicantId: participantId } },
                data: { status: 'SELECTED', selectedAt: new Date() }
            });
            // Check if plan is now full
            const selectedCount = await database_1.prisma.planApplication.count({
                where: { planId, status: 'SELECTED' }
            });
            if (selectedCount >= plan.capacity) {
                await database_1.prisma.plan.update({
                    where: { id: planId },
                    data: { status: 'FILLED' }
                });
            }
            res.json({ success: true, message: 'Applicant approved' });
        }
        else if (action === 'REJECT') {
            await database_1.prisma.planApplication.update({
                where: { planId_applicantId: { planId, applicantId: participantId } },
                data: { status: 'REJECTED' }
            });
            // Decrement applicant count
            await database_1.prisma.plan.update({
                where: { id: planId },
                data: { applicantCount: { decrement: 1 } }
            });
            res.json({ success: true, message: 'Applicant rejected' });
        }
        else {
            res.status(400).json({
                success: false,
                error: { code: 'INVALID_ACTION', message: 'Action must be APPROVE or REJECT' }
            });
        }
    }
    catch (error) {
        telemetry_1.log.error({ error }, '[PlansV2] Failed to manage participant');
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR' } });
    }
});
// Get My Plans
router.get('/my/plans', auth_1.rendezAuth, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const plans = await database_1.prisma.plan.findMany({
            where: {
                applications: { some: { applicantId: userId } }
            },
            include: {
                organizer: {
                    select: { id: true, name: true, karmaScore: true, meetupCount: true, photos: true }
                },
                applications: {
                    include: {
                        applicant: {
                            select: { id: true, name: true, karmaScore: true, meetupCount: true, photos: true }
                        }
                    }
                }
            },
            orderBy: { scheduledAt: 'asc' }
        });
        res.json({ success: true, data: plans });
    }
    catch (error) {
        telemetry_1.log.error({ error }, '[PlansV2] Failed to get my plans');
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR' } });
    }
});
// Helper functions
function mapCategoryToPrisma(category) {
    const mapping = {
        'DINING': 'DINNER',
        'SPORTS': 'SPORTS',
        'OUTDOOR': 'SPORTS',
        'WELLNESS': 'SPA',
        'SOCIAL': 'DINNER',
    };
    return mapping[category] || 'DINNER';
}
function mapGenderPref(pref) {
    if (!pref)
        return 'ANY';
    const mapping = {
        'MALE': 'MALE',
        'FEMALE': 'FEMALE',
        'ANY': 'ANY',
    };
    return mapping[pref] || 'ANY';
}
exports.default = router;
