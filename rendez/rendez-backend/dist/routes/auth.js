"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const database_1 = require("../config/database");
const sms_1 = require("../utils/sms");
const userAuth_1 = require("../middleware/userAuth");
const router = (0, express_1.Router)();
const sendOTPSchema = zod_1.z.object({ phone: zod_1.z.string().regex(/^\+91[6-9]\d{9}$/) });
const verifySchema = zod_1.z.object({ phone: zod_1.z.string(), otp: zod_1.z.string().length(4) });
const registerSchema = zod_1.z.object({
    phone: zod_1.z.string(),
    name: zod_1.z.string().min(2),
    email: zod_1.z.string().email().optional(),
    gender: zod_1.z.enum(['MALE', 'FEMALE', 'OTHER']),
    city: zod_1.z.string().optional(),
});
const profileSchema = zod_1.z.object({
    name: zod_1.z.string().optional(),
    bio: zod_1.z.string().max(500).optional(),
    photos: zod_1.z.array(zod_1.z.string().url()).max(6).optional(),
    interests: zod_1.z.array(zod_1.z.string()).optional(),
});
router.post('/send-otp', async (req, res) => {
    try {
        const { phone } = sendOTPSchema.parse(req.body);
        const otp = (0, sms_1.generateOTP)();
        await database_1.prisma.user.upsert({
            where: { phone },
            create: { phone, otpCode: otp, otpExpires: new Date(Date.now() + 5 * 60000) },
            update: { otpCode: otp, otpExpires: new Date(Date.now() + 5 * 60000) },
        });
        await (0, sms_1.sendSMS)(phone, `Your Rendez OTP is ${otp}`);
        res.json({ success: true, message: 'OTP sent' });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ success: false, error: 'Invalid phone number format. Must be +91 followed by 10 digits starting with 6-9' });
        }
        throw error;
    }
});
router.post('/verify-otp', async (req, res) => {
    try {
        const { phone, otp } = verifySchema.parse(req.body);
        const user = await database_1.prisma.user.findUnique({ where: { phone } });
        if (!user || user.otpCode !== otp || !user.otpExpires || user.otpExpires < new Date()) {
            return res.status(400).json({ success: false, error: 'Invalid OTP' });
        }
        const token = (0, userAuth_1.signToken)({ id: user.id, phone: user.phone });
        await database_1.prisma.user.update({
            where: { id: user.id },
            data: { otpCode: null, otpExpires: null },
        });
        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    isOnboarded: user.isOnboarded,
                    karmaScore: user.karmaScore,
                },
            },
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ success: false, error: 'Invalid request data' });
        }
        throw error;
    }
});
router.post('/register', userAuth_1.auth, async (req, res) => {
    try {
        const data = registerSchema.parse(req.body);
        // Verify the authenticated user matches the phone being registered
        if (!req.user || req.user.phone !== data.phone) {
            return res.status(403).json({ success: false, error: 'Phone number mismatch' });
        }
        const user = await database_1.prisma.user.update({
            where: { id: req.user.id },
            data: {
                name: data.name,
                email: data.email,
                gender: data.gender,
                city: data.city,
                isOnboarded: true,
            },
        });
        res.json({ success: true, data: user });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ success: false, error: 'Invalid registration data', details: error.errors });
        }
        throw error;
    }
});
router.get('/profile', userAuth_1.auth, async (req, res) => {
    try {
        const user = await database_1.prisma.user.findUnique({
            where: { id: req.user?.id },
            select: {
                id: true,
                name: true,
                phone: true,
                email: true,
                photos: true,
                karmaScore: true,
                reliability: true,
                karmaTier: true,
                totalMeetups: true,
                bio: true,
                city: true,
                interests: true,
                isOnboarded: true,
                createdAt: true,
            },
        });
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        res.json({ success: true, data: user });
    }
    catch (error) {
        throw error;
    }
});
router.patch('/profile', userAuth_1.auth, async (req, res) => {
    try {
        const data = profileSchema.parse(req.body);
        const user = await database_1.prisma.user.update({
            where: { id: req.user?.id },
            data,
        });
        res.json({ success: true, data: user });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ success: false, error: 'Invalid profile data', details: error.errors });
        }
        throw error;
    }
});
exports.default = router;
