"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const MatchService_1 = require("../services/MatchService");
const rateLimiter_1 = require("../middleware/rateLimiter");
const intentCapture_service_1 = require("../services/intentCapture.service");
const logger_1 = require("../config/logger");
const router = (0, express_1.Router)();
const matchService = new MatchService_1.MatchService();
function isValidId(id) {
    // CUID: starts with 'c', alphanumeric, ~25 chars
    // UUID: 8-4-4-4-12 hex pattern
    return /^c[a-z0-9]{24,}$/.test(id) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}
router.post('/likes/:profileId', auth_1.rendezAuth, rateLimiter_1.likeLimiter, async (req, res, next) => {
    try {
        if (!isValidId(req.params.profileId)) {
            return res.status(400).json({ message: 'INVALID_ID' });
        }
        const result = await matchService.sendLike(req.user.id, req.params.profileId);
        // RTMN Commerce Memory: Capture match received intent (non-blocking)
        if (result.matched && result.matchId) {
            (0, intentCapture_service_1.captureMatchReceived)({
                userId: req.user.id,
                matchId: result.matchId,
                matchedUserId: req.params.profileId,
                intent: 'DATING',
            }).catch((err) => logger_1.logger.warn('[IntentCapture] Failed to capture match received', { error: err, matchId: result.matchId }));
        }
        res.json(result);
    }
    catch (err) {
        next(err);
    }
});
router.get('/', auth_1.rendezAuth, async (req, res, next) => {
    try {
        const matches = await matchService.getMatches(req.user.id);
        res.json(matches);
    }
    catch (err) {
        next(err);
    }
});
router.delete('/:matchId', auth_1.rendezAuth, async (req, res, next) => {
    try {
        if (!isValidId(req.params.matchId)) {
            return res.status(400).json({ message: 'INVALID_ID' });
        }
        await matchService.unmatch(req.user.id, req.params.matchId);
        res.json({ success: true });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
