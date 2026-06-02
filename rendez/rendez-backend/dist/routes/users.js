"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// Get My Profile
router.get('/profile', auth_1.rendezAuth, async (req, res, next) => {
    try {
        const user = await database_1.prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                phone: true,
                name: true,
                email: true,
                bio: true,
                photos: true,
                gender: true,
                lookingFor: true,
                birthday: true,
                occupation: true,
                school: true,
                interests: true,
                height: true,
                city: true,
                karmaScore: true,
                karmaReliability: true,
                meetupCount: true,
                plansCreated: true,
                isVerified: true,
                createdAt: true,
            },
        });
        if (!user)
            throw new errorHandler_1.AppError(404, 'User not found');
        res.json({ success: true, data: user });
    }
    catch (err) {
        next(err);
    }
});
// Update Profile
router.patch('/profile', auth_1.rendezAuth, async (req, res, next) => {
    try {
        const updateSchema = zod_1.z.object({
            name: zod_1.z.string().min(2).max(50).optional(),
            bio: zod_1.z.string().max(200).optional(),
            photos: zod_1.z.array(zod_1.z.string().url()).max(6).optional(),
            gender: zod_1.z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
            lookingFor: zod_1.z.array(zod_1.z.enum(['MALE', 'FEMALE', 'OTHER'])).optional(),
            occupation: zod_1.z.string().optional(),
            school: zod_1.z.string().optional(),
            interests: zod_1.z.array(zod_1.z.string()).max(10).optional(),
            height: zod_1.z.number().int().min(100).max(250).optional(),
            city: zod_1.z.string().optional(),
        });
        const data = updateSchema.parse(req.body);
        const user = await database_1.prisma.user.update({
            where: { id: req.user.id },
            data,
            select: {
                id: true,
                name: true,
                bio: true,
                photos: true,
                karmaScore: true,
            },
        });
        res.json({ success: true, data: user });
    }
    catch (err) {
        next(err);
    }
});
// Get User by ID (for viewing profiles)
router.get('/:userId', auth_1.rendezAuth, async (req, res, next) => {
    try {
        const { userId } = req.params;
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                bio: true,
                photos: true,
                occupation: true,
                city: true,
                interests: true,
                karmaScore: true,
                karmaReliability: true,
                meetupCount: true,
                isVerified: true,
            },
        });
        if (!user)
            throw new errorHandler_1.AppError(404, 'User not found');
        res.json({ success: true, data: user });
    }
    catch (err) {
        next(err);
    }
});
// Update Preferences
router.patch('/preferences', auth_1.rendezAuth, async (req, res, next) => {
    try {
        const prefsSchema = zod_1.z.object({
            genderPreferences: zod_1.z.array(zod_1.z.enum(['MALE', 'FEMALE', 'OTHER'])).optional(),
            distancePreference: zod_1.z.number().int().min(1).max(100).optional(),
            agePreferenceMin: zod_1.z.number().int().min(18).max(60).optional(),
            agePreferenceMax: zod_1.z.number().int().min(18).max(60).optional(),
            categories: zod_1.z.array(zod_1.z.enum(['DINING', 'SPORTS', 'OUTDOOR', 'WELLNESS', 'SOCIAL'])).optional(),
            notificationsEnabled: zod_1.z.boolean().optional(),
        });
        const data = prefsSchema.parse(req.body);
        const preference = await database_1.prisma.preference.upsert({
            where: { userId: req.user.id },
            create: { userId: req.user.id, ...data },
            update: data,
        });
        res.json({ success: true, data: preference });
    }
    catch (err) {
        next(err);
    }
});
// Get Preferences
router.get('/preferences/me', auth_1.rendezAuth, async (req, res, next) => {
    try {
        const preference = await database_1.prisma.preference.findUnique({
            where: { userId: req.user.id },
        });
        res.json({ success: true, data: preference });
    }
    catch (err) {
        next(err);
    }
});
// Delete Account
router.delete('/account', auth_1.rendezAuth, async (req, res, next) => {
    try {
        await database_1.prisma.user.update({
            where: { id: req.user.id },
            data: { deletedAt: new Date() },
        });
        res.json({ success: true, message: 'Account deleted' });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
