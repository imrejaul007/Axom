"use strict";
/**
 * Referral routes
 * Base path: /api/v1/referral
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const ReferralService_1 = require("../services/ReferralService");
const database_1 = require("../config/database");
const redis_1 = require("../config/redis");
const router = (0, express_1.Router)();
const service = new ReferralService_1.ReferralService();
// GET /api/v1/referral/my-code — get own invite code + share link
router.get('/my-code', auth_1.rendezAuth, async (req, res, next) => {
    try {
        const result = await service.getMyCode(req.user.id);
        res.json(result);
    }
    catch (err) {
        next(err);
    }
});
// POST /api/v1/referral/apply — apply an invite code (called after profile creation if code was in deep link)
router.post('/apply', auth_1.rendezAuth, async (req, res, next) => {
    try {
        // RD-L-02 FIX: Validate referral code format — must be alphanumeric, 6-20 chars.
        const { code } = req.body;
        if (!code || typeof code !== 'string' || !/^[A-Za-z0-9]{6,20}$/.test(code)) {
            res.status(400).json({ message: 'code must be a 6-20 character alphanumeric string' });
            return;
        }
        // RZ-B-L7 FIX: Use Redis-backed idempotency key with a short TTL to prevent
        // both accidental double-submits and a client easily bypassing the header check.
        const idempotencyKey = req.headers['idempotency-key'];
        if (idempotencyKey) {
            const lockKey = `referral_apply:${req.user.id}:${idempotencyKey}`;
            const existing = await redis_1.redis.get(lockKey);
            if (existing) {
                res.json({ applied: true, alreadyApplied: true });
                return;
            }
            // Check DB as fallback
            const profile = await database_1.prisma.profile.findFirst({
                where: { id: req.user.id, referredBy: code },
            });
            if (profile) {
                // Cache the result in Redis for fast-path on retries
                await redis_1.redis.setex(lockKey, 3600, '1');
                res.json({ applied: true, alreadyApplied: true });
                return;
            }
        }
        await service.applyCode(req.user.id, code);
        // Stamp the idempotency result
        if (idempotencyKey) {
            await redis_1.redis.setex(`referral_apply:${req.user.id}:${idempotencyKey}`, 3600, '1');
        }
        res.json({ applied: true });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
