"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const router = (0, express_1.Router)();
// Rate limiter for messages: 60 messages per user per minute
const messageLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 60,
    keyGenerator: (req) => req.user?.id || req.ip || 'anon',
    message: { success: false, error: { code: 'MESSAGE_RATE_LIMIT', details: 'Maximum 60 messages per minute' } },
});
// Get Active Matches (approved plans with participants)
router.get('/', auth_1.rendezAuth, async (req, res, next) => {
    try {
        const userId = req.user.id;
        // Get plans where user is an approved participant
        const participants = await database_1.prisma.planParticipant.findMany({
            where: {
                userId,
                status: 'APPROVED',
            },
            include: {
                plan: {
                    include: {
                        creator: { select: { id: true, name: true, karmaScore: true, photos: true } },
                        participants: {
                            where: {
                                status: 'APPROVED',
                                userId: { not: userId },
                            },
                            include: {
                                user: { select: { id: true, name: true, karmaScore: true, photos: true } }
                            }
                        }
                    }
                }
            }
        });
        // Get recent messages for each match
        const matches = await Promise.all(participants
            .filter(p => ['OPEN', 'CONFIRMED'].includes(p.plan.status))
            .map(async (p) => {
            // Get last message
            const lastMessage = await database_1.prisma.message.findFirst({
                where: { planId: p.planId },
                orderBy: { createdAt: 'desc' },
                include: {
                    sender: { select: { id: true, name: true } }
                }
            });
            // Calculate unread count
            const unreadCount = await database_1.prisma.message.count({
                where: {
                    planId: p.planId,
                    senderId: { not: userId },
                    read: false
                }
            });
            return {
                id: p.planId,
                plan: {
                    id: p.plan.id,
                    title: p.plan.title,
                    category: p.plan.category,
                    date: p.plan.date,
                    location: p.plan.location,
                    status: p.plan.status,
                    creator: p.plan.creator,
                },
                partner: p.plan.participants[0]?.user,
                lastMessage: lastMessage ? {
                    id: lastMessage.id,
                    content: lastMessage.content,
                    type: lastMessage.type,
                    read: lastMessage.read,
                    createdAt: lastMessage.createdAt,
                    sender: lastMessage.sender,
                } : null,
                unreadCount,
            };
        }));
        res.json({ success: true, data: matches });
    }
    catch (err) {
        next(err);
    }
});
// Get Messages for a Match (Plan)
router.get('/:planId/messages', auth_1.rendezAuth, async (req, res, next) => {
    try {
        const { planId } = req.params;
        const { limit = '50', before } = req.query;
        // Verify user is part of this plan
        const participant = await database_1.prisma.planParticipant.findUnique({
            where: {
                planId_userId: { planId, userId: req.user.id }
            }
        });
        if (!participant) {
            return res.status(403).json({
                success: false,
                error: { code: 'UNAUTHORIZED' }
            });
        }
        const messages = await database_1.prisma.message.findMany({
            where: { planId },
            include: {
                sender: { select: { id: true, name: true, karmaScore: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: Number(limit),
            ...(before && { cursor: { id: before }, skip: 1 }),
        });
        // Mark messages as read
        await database_1.prisma.message.updateMany({
            where: {
                planId,
                senderId: { not: req.user.id },
                read: false
            },
            data: { read: true }
        });
        res.json({ success: true, data: messages.reverse() });
    }
    catch (err) {
        next(err);
    }
});
// Send Message
router.post('/:planId/messages', auth_1.rendezAuth, messageLimiter, async (req, res, next) => {
    try {
        const { planId } = req.params;
        const schema = zod_1.z.object({
            content: zod_1.z.string().min(1).max(1000)
        });
        const parseResult = schema.safeParse(req.body);
        if (!parseResult.success) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', details: parseResult.error.issues }
            });
        }
        const { content } = parseResult.data;
        // Verify user is part of this plan with approved status
        const participant = await database_1.prisma.planParticipant.findUnique({
            where: {
                planId_userId: { planId, userId: req.user.id }
            }
        });
        if (!participant || participant.status !== 'APPROVED') {
            return res.status(403).json({
                success: false,
                error: { code: 'UNAUTHORIZED' }
            });
        }
        const message = await database_1.prisma.message.create({
            data: {
                planId,
                senderId: req.user.id,
                content,
                type: 'TEXT',
            },
            include: {
                sender: { select: { id: true, name: true, karmaScore: true } }
            }
        });
        // Emit via Socket.io (if available)
        const io = req.app.get('io');
        if (io) {
            io
                .to(`plan:${planId}`)
                .emit('newMessage', message);
        }
        res.status(201).json({ success: true, data: message });
    }
    catch (err) {
        next(err);
    }
});
// Get Plan Details
router.get('/:planId', auth_1.rendezAuth, async (req, res, next) => {
    try {
        const { planId } = req.params;
        const plan = await database_1.prisma.plan.findUnique({
            where: { id: planId },
            include: {
                creator: { select: { id: true, name: true, karmaScore: true, karmaReliability: true, photos: true } },
                participants: {
                    where: { status: 'APPROVED' },
                    include: {
                        user: { select: { id: true, name: true, karmaScore: true, photos: true } }
                    }
                }
            }
        });
        if (!plan) {
            return res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND' }
            });
        }
        // Verify requesting user is a participant
        const isParticipant = plan.participants.some(p => p.userId === req.user.id);
        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                error: { code: 'UNAUTHORIZED' }
            });
        }
        res.json({ success: true, data: plan });
    }
    catch (err) {
        next(err);
    }
});
// Get Participants for a Plan
router.get('/:planId/participants', auth_1.rendezAuth, async (req, res, next) => {
    try {
        const { planId } = req.params;
        const { status } = req.query;
        // Verify user is part of this plan
        const participant = await database_1.prisma.planParticipant.findUnique({
            where: {
                planId_userId: { planId, userId: req.user.id }
            }
        });
        if (!participant) {
            return res.status(403).json({
                success: false,
                error: { code: 'UNAUTHORIZED' }
            });
        }
        const participants = await database_1.prisma.planParticipant.findMany({
            where: {
                planId,
                ...(status && { status: status })
            },
            include: {
                user: { select: { id: true, name: true, karmaScore: true, photos: true, meetupCount: true } }
            },
            orderBy: { appliedAt: 'desc' }
        });
        res.json({ success: true, data: participants });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
