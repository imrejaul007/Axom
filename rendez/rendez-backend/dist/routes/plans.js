"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// Validation schema for creating plans
const createPlanSchema = zod_1.z.object({
    title: zod_1.z.string().min(3).max(200),
    description: zod_1.z.string().max(500).optional(),
    category: zod_1.z.nativeEnum(client_1.PlanCategory),
    dateTime: zod_1.z.string().datetime(),
    venue: zod_1.z.string().min(3),
    address: zod_1.z.string().optional(),
    lat: zod_1.z.number().min(-90).max(90),
    lng: zod_1.z.number().min(-180).max(180),
    totalSlots: zod_1.z.number().int().min(2).max(10).default(2),
    isBooked: zod_1.z.boolean().default(false),
    bookingId: zod_1.z.string().optional(),
    minKarma: zod_1.z.number().int().min(0).max(100).optional(),
    genderPref: zod_1.z.nativeEnum(client_1.Gender).optional(),
});
// POST /api/v1/plans — create a plan
router.post('/', auth_1.rendezAuth, async (req, res, next) => {
    try {
        const data = createPlanSchema.parse(req.body);
        const plan = await database_1.prisma.plan.create({
            data: {
                title: data.title,
                description: data.description,
                category: data.category,
                dateTime: new Date(data.dateTime),
                venue: data.venue,
                address: data.address,
                lat: data.lat,
                lng: data.lng,
                totalSlots: data.totalSlots,
                isBooked: data.isBooked,
                bookingId: data.bookingId,
                minKarma: data.minKarma,
                genderPref: data.genderPref,
                creatorId: req.user.id,
                filledSlots: 1,
                timezone: 'Asia/Kolkata',
            },
            include: {
                creator: {
                    select: { id: true, name: true, karmaScore: true, reliability: true },
                },
            },
        });
        // Add creator as first participant
        await database_1.prisma.planParticipant.create({
            data: {
                planId: plan.id,
                userId: req.user.id,
                status: 'APPROVED',
            },
        });
        res.status(201).json({ success: true, data: plan });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ success: false, error: 'Validation failed', details: error.errors });
        }
        next(error);
    }
});
// GET /api/v1/plans — list plans with filters
router.get('/', auth_1.rendezAuth, async (req, res, next) => {
    try {
        const { category, search, my } = req.query;
        const where = {};
        if (category)
            where.category = category;
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { venue: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (my === 'true') {
            where.participants = { some: { userId: req.user.id } };
        }
        const plans = await database_1.prisma.plan.findMany({
            where: {
                status: 'OPEN',
                dateTime: { gte: new Date() },
                ...where,
            },
            include: {
                creator: {
                    select: { id: true, name: true, karmaScore: true },
                },
            },
            orderBy: { dateTime: 'asc' },
            take: 20,
        });
        res.json({ success: true, data: plans });
    }
    catch (error) {
        next(error);
    }
});
// GET /api/v1/plans/:id — get plan details
router.get('/:id', auth_1.rendezAuth, async (req, res, next) => {
    try {
        const plan = await database_1.prisma.plan.findUnique({
            where: { id: req.params.id },
            include: {
                creator: true,
                participants: {
                    include: { user: true },
                },
            },
        });
        if (!plan) {
            return res.status(404).json({ success: false, error: 'Plan not found' });
        }
        res.json({ success: true, data: plan });
    }
    catch (error) {
        next(error);
    }
});
// POST /api/v1/plans/:id/apply — apply to join a plan
router.post('/:id/apply', auth_1.rendezAuth, async (req, res, next) => {
    try {
        const { message } = req.body;
        // Check if already applied
        const existing = await database_1.prisma.planParticipant.findUnique({
            where: { planId_userId: { planId: req.params.id, userId: req.user.id } },
        });
        if (existing) {
            return res.status(400).json({ success: false, error: 'Already applied' });
        }
        // Check if plan exists and has capacity
        const plan = await database_1.prisma.plan.findUnique({ where: { id: req.params.id } });
        if (!plan) {
            return res.status(404).json({ success: false, error: 'Plan not found' });
        }
        if (plan.filledSlots >= plan.totalSlots) {
            return res.status(400).json({ success: false, error: 'Plan full' });
        }
        // Check if user is the creator
        if (plan.creatorId === req.user.id) {
            return res.status(400).json({ success: false, error: 'Cannot apply to your own plan' });
        }
        const participant = await database_1.prisma.planParticipant.create({
            data: {
                planId: req.params.id,
                userId: req.user.id,
                message,
                status: 'APPLIED',
            },
        });
        res.status(201).json({ success: true, data: participant });
    }
    catch (error) {
        next(error);
    }
});
// POST /api/v1/plans/:id/approve/:userId — approve an applicant
router.post('/:id/approve/:userId', auth_1.rendezAuth, async (req, res, next) => {
    try {
        const plan = await database_1.prisma.plan.findUnique({ where: { id: req.params.id } });
        if (!plan) {
            return res.status(404).json({ success: false, error: 'Plan not found' });
        }
        if (plan.creatorId !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Only the creator can approve participants' });
        }
        // Check if plan is full
        if (plan.filledSlots >= plan.totalSlots) {
            return res.status(400).json({ success: false, error: 'Plan already full' });
        }
        // Update participant status
        await database_1.prisma.planParticipant.update({
            where: { planId_userId: { planId: req.params.id, userId: req.params.userId } },
            data: { status: 'APPROVED', respondedAt: new Date() },
        });
        // Increment filled slots
        const updatedPlan = await database_1.prisma.plan.update({
            where: { id: req.params.id },
            data: { filledSlots: { increment: 1 } },
        });
        // Check if plan is now full and update status to MATCHED
        if (updatedPlan.filledSlots >= updatedPlan.totalSlots) {
            await database_1.prisma.plan.update({
                where: { id: req.params.id },
                data: { status: 'MATCHED' },
            });
        }
        res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
});
// POST /api/v1/plans/:id/reject/:userId — reject an applicant
router.post('/:id/reject/:userId', auth_1.rendezAuth, async (req, res, next) => {
    try {
        const plan = await database_1.prisma.plan.findUnique({ where: { id: req.params.id } });
        if (!plan) {
            return res.status(404).json({ success: false, error: 'Plan not found' });
        }
        if (plan.creatorId !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Only the creator can reject participants' });
        }
        await database_1.prisma.planParticipant.update({
            where: { planId_userId: { planId: req.params.id, userId: req.params.userId } },
            data: { status: 'REJECTED' },
        });
        res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
});
// DELETE /api/v1/plans/:id — cancel/delete a plan (creator only)
router.delete('/:id', auth_1.rendezAuth, async (req, res, next) => {
    try {
        const plan = await database_1.prisma.plan.findUnique({ where: { id: req.params.id } });
        if (!plan) {
            return res.status(404).json({ success: false, error: 'Plan not found' });
        }
        if (plan.creatorId !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Only the creator can delete this plan' });
        }
        // Delete all participants first
        await database_1.prisma.planParticipant.deleteMany({ where: { planId: req.params.id } });
        // Delete the plan
        await database_1.prisma.plan.delete({ where: { id: req.params.id } });
        res.json({ success: true, message: 'Plan deleted successfully' });
    }
    catch (error) {
        next(error);
    }
});
// PUT /api/v1/plans/:id — update a plan (creator only)
router.put('/:id', auth_1.rendezAuth, async (req, res, next) => {
    try {
        const plan = await database_1.prisma.plan.findUnique({ where: { id: req.params.id } });
        if (!plan) {
            return res.status(404).json({ success: false, error: 'Plan not found' });
        }
        if (plan.creatorId !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Only the creator can update this plan' });
        }
        const updateData = createPlanSchema.partial().parse(req.body);
        const updatedPlan = await database_1.prisma.plan.update({
            where: { id: req.params.id },
            data: {
                title: updateData.title,
                description: updateData.description,
                category: updateData.category,
                dateTime: updateData.dateTime ? new Date(updateData.dateTime) : undefined,
                venue: updateData.venue,
                address: updateData.address,
                lat: updateData.lat,
                lng: updateData.lng,
                totalSlots: updateData.totalSlots,
                isBooked: updateData.isBooked,
                bookingId: updateData.bookingId,
                minKarma: updateData.minKarma,
                genderPref: updateData.genderPref,
            },
            include: {
                creator: {
                    select: { id: true, name: true, karmaScore: true, reliability: true },
                },
            },
        });
        res.json({ success: true, data: updatedPlan });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ success: false, error: 'Validation failed', details: error.errors });
        }
        next(error);
    }
});
// POST /api/v1/plans/:id/leave — leave a plan (participant only)
router.post('/:id/leave', auth_1.rendezAuth, async (req, res, next) => {
    try {
        const plan = await database_1.prisma.plan.findUnique({ where: { id: req.params.id } });
        if (!plan) {
            return res.status(404).json({ success: false, error: 'Plan not found' });
        }
        if (plan.creatorId === req.user.id) {
            return res.status(400).json({ success: false, error: 'Creator cannot leave the plan. Use delete instead.' });
        }
        const participant = await database_1.prisma.planParticipant.findUnique({
            where: { planId_userId: { planId: req.params.id, userId: req.user.id } },
        });
        if (!participant) {
            return res.status(404).json({ success: false, error: 'You are not a participant of this plan' });
        }
        // Remove participant
        await database_1.prisma.planParticipant.delete({
            where: { planId_userId: { planId: req.params.id, userId: req.user.id } },
        });
        // Decrement filled slots
        await database_1.prisma.plan.update({
            where: { id: req.params.id },
            data: { filledSlots: { decrement: 1 } },
        });
        res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
