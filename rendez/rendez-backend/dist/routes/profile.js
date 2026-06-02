"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const zod_1 = require("zod");
const trust_1 = require("../utils/trust");
const rateLimiter_1 = require("../middleware/rateLimiter");
const intentCapture_service_1 = require("../services/intentCapture.service");
const logger_1 = require("../config/logger");
const router = (0, express_1.Router)();
function isValidId(id) {
    // CUID: starts with 'c', alphanumeric, ~25 chars
    // UUID: 8-4-4-4-12 hex pattern
    return /^c[a-z0-9]{24,}$/.test(id) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}
const createSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(50),
    bio: zod_1.z.string().max(300).optional(),
    age: zod_1.z.number().int().min(18).max(60),
    gender: zod_1.z.enum(['MALE', 'FEMALE', 'NON_BINARY']),
    interestedIn: zod_1.z.array(zod_1.z.enum(['MALE', 'FEMALE', 'NON_BINARY'])).min(1),
    intent: zod_1.z.enum(['DATING', 'FRIENDSHIP', 'NETWORKING']).optional(),
    city: zod_1.z.string().min(2),
    lat: zod_1.z.number().optional(),
    lng: zod_1.z.number().optional(),
});
// Profile creation uses rezAuth: new users have a token with sub=rezUserId (no profile ID yet)
router.post('/', auth_1.rezAuth, async (req, res, next) => {
    try {
        const data = createSchema.parse(req.body);
        const existing = await database_1.prisma.profile.findUnique({ where: { rezUserId: req.user.rezUserId } });
        if (existing)
            throw new errorHandler_1.AppError(409, 'Profile already exists');
        const profile = await database_1.prisma.profile.create({
            data: {
                ...data,
                rezUserId: req.user.rezUserId,
                phone: req.user.phone,
            },
        });
        // RTMN Commerce Memory: Capture profile creation intent (non-blocking)
        (0, intentCapture_service_1.captureProfileCreated)({
            userId: profile.id,
            profileId: profile.id,
            intent: data.intent,
        }).catch((err) => logger_1.logger.warn('[IntentCapture] Failed to capture profile created', { error: err, profileId: profile.id }));
        res.status(201).json(profile);
    }
    catch (err) {
        next(err);
    }
});
router.get('/me', auth_1.rendezAuth, async (req, res, next) => {
    try {
        const profile = await database_1.prisma.profile.findUnique({ where: { id: req.user.id } });
        if (!profile)
            throw new errorHandler_1.AppError(404, 'Profile not found');
        res.json(profile);
    }
    catch (err) {
        next(err);
    }
});
// RZ-M-B1: age added to PATCH schema for server-side age verification on updates.
// Previously age was only validated at creation time. Now users can update their age
// and it must pass server-side range validation (18-60).
const patchSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(50).optional(),
    bio: zod_1.z.string().max(300).optional(),
    intent: zod_1.z.enum(['DATING', 'FRIENDSHIP', 'NETWORKING']).optional(),
    interestedIn: zod_1.z.array(zod_1.z.enum(['MALE', 'FEMALE', 'NON_BINARY'])).min(1).optional(),
    city: zod_1.z.string().min(2).max(60).optional(),
    lat: zod_1.z.number().optional(),
    lng: zod_1.z.number().optional(),
    // RZ-M-B1: age field with server-side range validation
    age: zod_1.z.number().int().min(18).max(60).optional(),
    // photos must be Cloudinary URLs (https://res.cloudinary.com/...) — max 6
    photos: zod_1.z.array(zod_1.z.string().url().regex(/^https:\/\/res\.cloudinary\.com\//, 'Only Cloudinary URLs allowed')).max(6).optional(),
    // Sprint 12: safety settings
    requireMessageRequest: zod_1.z.boolean().optional(),
    verifiedOnly: zod_1.z.boolean().optional(),
    onlyVerifiedCanLike: zod_1.z.boolean().optional(),
});
router.patch('/me', auth_1.rendezAuth, async (req, res, next) => {
    try {
        const updates = patchSchema.parse(req.body);
        // H-6 FIX: prisma.update returns the mutated record directly — no need for a
        // separate findUnique call. The returned object is always the fresh DB state.
        const profile = await database_1.prisma.profile.update({
            where: { id: req.user.id },
            data: updates,
        });
        res.json(profile);
    }
    catch (err) {
        next(err);
    }
});
// GET /api/v1/profile/:id — public profile view (used by ProfileDetailScreen)
// Strips private fields; checks block relationship
// RD-M-14 FIX: Apply rate limiting to prevent profile enumeration attacks.
router.get('/:id', auth_1.rendezAuth, rateLimiter_1.defaultLimiter, async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isValidId(id)) {
            return res.status(400).json({ message: 'INVALID_ID' });
        }
        const viewerId = req.user.id;
        // Check block in either direction
        const block = await database_1.prisma.block.findFirst({
            where: {
                OR: [
                    { blockerId: viewerId, blockedId: id },
                    { blockerId: id, blockedId: viewerId },
                ],
            },
        });
        if (block)
            throw new errorHandler_1.AppError(404, 'Profile not found');
        const profile = await database_1.prisma.profile.findUnique({
            where: { id, isActive: true, isSuspended: false },
            select: {
                id: true, name: true, age: true, gender: true, city: true,
                bio: true, photos: true, intent: true, isVerified: true,
                profileScore: true, rezSpendScore: true,
                meetupCount: true, responseRate: true, lastActiveAt: true,
                createdAt: true,
            },
        });
        if (!profile)
            throw new errorHandler_1.AppError(404, 'Profile not found');
        // RTMN Commerce Memory: Capture profile view intent (non-blocking)
        (0, intentCapture_service_1.captureProfileView)({
            userId: viewerId,
            viewedUserId: id,
            intent: profile.intent,
        }).catch((err) => logger_1.logger.warn('[IntentCapture] Failed to capture profile view', { error: err, viewedUserId: id }));
        const trustSignals = (0, trust_1.computeTrustSignals)(profile);
        res.json({ ...profile, trustSignals });
    }
    catch (err) {
        next(err);
    }
});
// DELETE /api/v1/profile/me — hard delete (user-initiated account deletion)
router.delete('/me', auth_1.rendezAuth, async (req, res, next) => {
    try {
        // Soft-delete: deactivate + anonymise PII so related records stay intact
        await database_1.prisma.profile.update({
            where: { id: req.user.id },
            data: {
                isActive: false,
                name: 'Deleted User',
                bio: null,
                photos: [],
                city: 'Unknown',
            },
        });
        res.json({ deleted: true });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
