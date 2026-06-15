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
const express_1 = require("express");
const zod_1 = require("zod");
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const crypto = __importStar(require("crypto"));
const router = (0, express_1.Router)();
const checkinSchema = zod_1.z.object({
    meetupId: zod_1.z.string(),
    lat: zod_1.z.number(),
    lng: zod_1.z.number(),
});
// Create meetup after plan is confirmed
router.post('/', auth_1.rendezAuth, async (req, res, next) => {
    try {
        const { planId } = req.body;
        const plan = await database_1.prisma.plan.findUnique({ where: { id: planId } });
        if (!plan)
            return res.status(404).json({ success: false, error: 'Plan not found' });
        const qr = crypto.randomBytes(32).toString('hex');
        const meetup = await database_1.prisma.meetup.create({
            data: { planId, creatorId: req.user.id, qrCode: qr, expiresAt: new Date(plan.dateTime.getTime() + 2 * 60 * 60 * 1000) },
        });
        res.json({ success: true, data: meetup });
    }
    catch (err) {
        next(err);
    }
});
// Get user's meetups
router.get('/my', auth_1.rendezAuth, async (req, res, next) => {
    try {
        const meetups = await database_1.prisma.meetup.findMany({
            where: {
                plan: {
                    participants: {
                        some: {
                            userId: req.user.id,
                            status: { in: ['APPROVED', 'CONFIRMED'] },
                        },
                    },
                },
            },
            include: { plan: { include: { participants: true } }, checkIns: true },
            orderBy: { expiresAt: 'asc' },
        });
        res.json({ success: true, data: meetups });
    }
    catch (err) {
        next(err);
    }
});
// Check-in
router.post('/checkin', auth_1.rendezAuth, async (req, res, next) => {
    try {
        const { meetupId, lat, lng } = zod_1.z.object({ meetupId: zod_1.z.string(), lat: zod_1.z.number(), lng: zod_1.z.number() }).parse(req.body);
        const meetup = await database_1.prisma.meetup.findUnique({
            where: { id: meetupId },
            include: {
                plan: { include: { participants: true } },
                checkIns: true,
            },
        });
        if (!meetup)
            return res.status(404).json({ success: false, error: 'Meetup not found' });
        const participant = meetup.plan.participants.find(p => p.userId === req.user.id);
        if (!participant)
            return res.status(403).json({ success: false, error: 'Not participant' });
        const dist = distance(lat, lng, meetup.plan.lat || 0, meetup.plan.lng || 0);
        if (dist > 500)
            return res.status(400).json({ success: false, error: 'Location too far' });
        await database_1.prisma.checkIn.create({ data: { meetupId, userId: req.user.id, lat, lng } });
        const checks = await database_1.prisma.checkIn.count({ where: { meetupId } });
        if (checks >= meetup.plan.participants.length) {
            await database_1.prisma.meetup.update({ where: { id: meetupId }, data: { status: 'VERIFIED' } });
            // Update karma for all participants
            for (const p of meetup.plan.participants) {
                await recalcKarma(p.userId);
            }
        }
        else {
            await database_1.prisma.meetup.update({ where: { id: meetupId }, data: { status: 'ACTIVE' } });
        }
        res.json({ success: true, message: 'Checked in' });
    }
    catch (err) {
        next(err);
    }
});
function distance(lat1, lng1, lat2, lng2) {
    return Math.sqrt((lat1 - lat2) ** 2 + (lng1 - lng2) ** 2) * 111000;
}
async function recalcKarma(userId) {
    try {
        const logs = await database_1.prisma.karmaLog.groupBy({
            by: ['event'],
            where: { userId },
            _count: { id: true },
            _sum: { delta: true },
        });
        const user = await database_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            return;
        const score = Math.max(0, Math.min(100, user.karmaScore + logs.reduce((s, l) => s + (l._sum.delta || 0), 0)));
        const tier = score >= 80 ? 'RELIABLE' : score >= 60 ? 'GOOD' : score >= 30 ? 'NEW' : 'RISKY';
        await database_1.prisma.user.update({ where: { id: userId }, data: { karmaScore: score, karmaTier: tier } });
    }
    catch (err) {
        console.error('Failed to recalc karma:', err);
    }
}
exports.default = router;
