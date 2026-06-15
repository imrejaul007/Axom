"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const telemetry_1 = require("../config/telemetry");
const router = (0, express_1.Router)();
// Get Karma
router.get('/', auth_1.rendezAuth, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const profile = await database_1.prisma.profile.findUnique({
            where: { id: userId },
            select: {
                karmaScore: true,
                meetupCount: true,
                photos: true,
            }
        });
        if (!profile) {
            return res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Profile not found' }
            });
        }
        // Calculate tier
        let tier = 'NEW';
        if ((profile.karmaScore ?? 0) >= 80)
            tier = 'RELIABLE';
        else if ((profile.karmaScore ?? 0) >= 60)
            tier = 'GOOD';
        else if ((profile.karmaScore ?? 0) < 30)
            tier = 'RISKY';
        // Calculate reliability score based on meetup count and karma
        const reliability = profile.meetupCount > 0
            ? Math.min(1, profile.meetupCount / 10) * (profile.karmaScore ?? 0) / 100
            : 0.5;
        res.json({
            success: true,
            data: {
                score: profile.karmaScore ?? 0,
                reliability,
                tier,
                meetupsAttended: profile.meetupCount,
                photosCount: profile.photos?.length ?? 0,
            }
        });
    }
    catch (error) {
        telemetry_1.log.error({ error }, '[Karma] Failed to get karma');
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR' } });
    }
});
// Get Karma Log
router.get('/log', auth_1.rendezAuth, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const limit = Math.min(Number(req.query.limit) || 50, 100);
        // For now, return empty log as KarmaLog model doesn't exist yet
        // This endpoint is ready when the model is added
        res.json({
            success: true,
            data: {
                logs: [],
                message: 'Karma logging will be available when the KarmaLog model is added to the schema'
            }
        });
    }
    catch (error) {
        telemetry_1.log.error({ error }, '[Karma] Failed to get karma log');
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR' } });
    }
});
// Record Feedback for a Plan
router.post('/:planId/feedback', auth_1.rendezAuth, async (req, res, next) => {
    try {
        const { planId } = req.params;
        const { rating, notes } = req.body; // GREAT, OKAY, ISSUES
        const userId = req.user.id;
        // Verify user is part of this plan
        const application = await database_1.prisma.planApplication.findUnique({
            where: {
                planId_applicantId: { planId, applicantId: userId }
            }
        });
        if (!application || application.status !== 'SELECTED') {
            return res.status(403).json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'You must be a selected participant to give feedback' }
            });
        }
        // Get plan and other participants
        const plan = await database_1.prisma.plan.findUnique({
            where: { id: planId },
            include: {
                applications: {
                    where: {
                        applicantId: { not: userId },
                        status: 'SELECTED'
                    },
                    include: {
                        applicant: {
                            select: { id: true, name: true, karmaScore: true, meetupCount: true }
                        }
                    }
                }
            }
        });
        if (!plan) {
            return res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Plan not found' }
            });
        }
        // Determine karma delta based on rating
        let delta = 5; // Default for showing up
        let event = 'SHOWED_UP';
        if (rating === 'GREAT') {
            delta = 3;
            event = 'GOOD_FEEDBACK';
        }
        else if (rating === 'ISSUES') {
            delta = -5;
            event = 'BAD_FEEDBACK';
        }
        // Update other participants karma
        const updatePromises = plan.applications.map(async (p) => {
            const currentKarma = p.applicant.karmaScore ?? 0;
            const currentMeetups = p.applicant.meetupCount;
            // Calculate new reliability
            const newReliability = currentMeetups > 0
                ? (currentKarma + delta) / (currentMeetups + 1) / 100
                : 0.5;
            await database_1.prisma.profile.update({
                where: { id: p.applicantId },
                data: {
                    karmaScore: Math.max(0, Math.min(100, currentKarma + delta)),
                    meetupCount: { increment: 1 },
                }
            });
            telemetry_1.log.info({
                userId: p.applicantId,
                planId,
                delta,
                event,
                rating
            }, '[Karma] Feedback recorded');
        });
        await Promise.all(updatePromises);
        // Mark application as completed/attended
        await database_1.prisma.planApplication.update({
            where: {
                planId_applicantId: { planId, applicantId: userId }
            },
            data: {
                status: 'SELECTED' // Keep as selected, could add ATTENDED status
            }
        });
        // Update plan status if all participants have given feedback
        const pendingFeedback = await database_1.prisma.planApplication.count({
            where: {
                planId,
                status: 'SELECTED'
            }
        });
        if (pendingFeedback === 0) {
            await database_1.prisma.plan.update({
                where: { id: planId },
                data: { status: 'COMPLETED' }
            });
        }
        res.json({
            success: true,
            message: 'Feedback recorded successfully',
            data: {
                planId,
                rating,
                participantsUpdated: plan.applications.length
            }
        });
    }
    catch (error) {
        telemetry_1.log.error({ error }, '[Karma] Failed to record feedback');
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR' } });
    }
});
// Get Karma Leaderboard (top users by karma)
router.get('/leaderboard', auth_1.rendezAuth, async (req, res, next) => {
    try {
        const limit = Math.min(Number(req.query.limit) || 20, 50);
        const leaders = await database_1.prisma.profile.findMany({
            where: {
                isActive: true,
                isDeleted: false,
                karmaScore: { gte: 0 }
            },
            select: {
                id: true,
                name: true,
                karmaScore: true,
                meetupCount: true,
                photos: true,
            },
            orderBy: { karmaScore: 'desc' },
            take: limit,
        });
        // Add tier to each leader
        const leadersWithTier = leaders.map((leader, index) => {
            let tier = 'NEW';
            if ((leader.karmaScore ?? 0) >= 80)
                tier = 'RELIABLE';
            else if ((leader.karmaScore ?? 0) >= 60)
                tier = 'GOOD';
            else if ((leader.karmaScore ?? 0) < 30)
                tier = 'RISKY';
            return {
                rank: index + 1,
                ...leader,
                tier
            };
        });
        res.json({ success: true, data: leadersWithTier });
    }
    catch (error) {
        telemetry_1.log.error({ error }, '[Karma] Failed to get leaderboard');
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR' } });
    }
});
// Get User Karma by ID
router.get('/user/:userId', auth_1.rendezAuth, async (req, res, next) => {
    try {
        const { userId } = req.params;
        const profile = await database_1.prisma.profile.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                karmaScore: true,
                meetupCount: true,
                photos: true,
            }
        });
        if (!profile) {
            return res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'User not found' }
            });
        }
        // Calculate tier
        let tier = 'NEW';
        if ((profile.karmaScore ?? 0) >= 80)
            tier = 'RELIABLE';
        else if ((profile.karmaScore ?? 0) >= 60)
            tier = 'GOOD';
        else if ((profile.karmaScore ?? 0) < 30)
            tier = 'RISKY';
        res.json({
            success: true,
            data: {
                id: profile.id,
                name: profile.name,
                karmaScore: profile.karmaScore ?? 0,
                tier,
                meetupsAttended: profile.meetupCount,
            }
        });
    }
    catch (error) {
        telemetry_1.log.error({ error }, '[Karma] Failed to get user karma');
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR' } });
    }
});
exports.default = router;
