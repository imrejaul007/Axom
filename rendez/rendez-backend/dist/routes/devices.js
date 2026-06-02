"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const redis_1 = require("../config/redis");
const router = (0, express_1.Router)();
// RD-L-03 FIX: Validate FCM token structure and platform enum before storing.
// Previously any JSON value in the body would be stored unchecked.
router.post('/token', auth_1.rendezAuth, async (req, res, next) => {
    try {
        const { fcmToken, platform } = req.body;
        // Token must be a non-empty string (FCM tokens are 140+ chars)
        if (!fcmToken || typeof fcmToken !== 'string' || fcmToken.length < 50) {
            return res.status(400).json({ message: 'fcmToken must be a valid FCM token string' });
        }
        const VALID_PLATFORMS = ['ios', 'android', 'web'];
        if (platform && typeof platform !== 'string' || (platform && !VALID_PLATFORMS.includes(platform))) {
            return res.status(400).json({ message: 'platform must be ios, android, or web' });
        }
        // Store token keyed by profile ID — TTL 90 days (re-registered on app launch)
        await redis_1.redis.setex(`fcm:${req.user.id}`, 90 * 86400, JSON.stringify({ fcmToken, platform: platform || 'unknown' }));
        res.json({ registered: true });
    }
    catch (err) {
        next(err);
    }
});
// DELETE /api/v1/devices/token — deregister on logout
router.delete('/token', auth_1.rendezAuth, async (req, res, next) => {
    try {
        await redis_1.redis.del(`fcm:${req.user.id}`);
        res.json({ deregistered: true });
    }
    catch (err) {
        next(err);
    }
});
// PATCH /api/v1/devices/preferences — save notification preferences
router.patch('/preferences', auth_1.rendezAuth, async (req, res, next) => {
    try {
        const { notifications } = req.body;
        if (!notifications)
            return res.status(400).json({ message: 'notifications object required' });
        await redis_1.redis.setex(`notif_prefs:${req.user.id}`, 365 * 86400, JSON.stringify(notifications));
        res.json({ saved: true });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
