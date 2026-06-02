"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const ModerationService_1 = require("../services/ModerationService");
const client_1 = require("@prisma/client");
const errorHandler_1 = require("../middleware/errorHandler");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
const moderation = new ModerationService_1.ModerationService();
const VALID_REPORT_REASONS = Object.values(client_1.ReportReason);
function isValidId(id) {
    // CUID: starts with 'c', alphanumeric, ~25 chars
    // UUID: 8-4-4-4-12 hex pattern
    return /^c[a-z0-9]{24,}$/.test(id) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}
router.post('/users/:profileId/report', auth_1.rendezAuth, rateLimiter_1.reportLimiter, async (req, res, next) => {
    try {
        if (!isValidId(req.params.profileId)) {
            return res.status(400).json({ message: 'INVALID_ID' });
        }
        const { reason, detail } = req.body;
        if (!reason || !VALID_REPORT_REASONS.includes(reason)) {
            throw new errorHandler_1.AppError(400, `Invalid reason. Must be one of: ${VALID_REPORT_REASONS.join(', ')}`);
        }
        await moderation.reportUser(req.user.id, req.params.profileId, reason, detail);
        res.json({ success: true });
    }
    catch (err) {
        next(err);
    }
});
router.post('/users/:profileId/block', auth_1.rendezAuth, rateLimiter_1.blockLimiter, async (req, res, next) => {
    try {
        if (!isValidId(req.params.profileId)) {
            return res.status(400).json({ message: 'INVALID_ID' });
        }
        await moderation.blockUser(req.user.id, req.params.profileId);
        res.json({ success: true });
    }
    catch (err) {
        next(err);
    }
});
router.get('/blocks', auth_1.rendezAuth, async (req, res, next) => {
    try {
        const blocks = await moderation.getBlocks(req.user.id);
        res.json(blocks);
    }
    catch (err) {
        next(err);
    }
});
router.delete('/blocks/:profileId', auth_1.rendezAuth, async (req, res, next) => {
    try {
        if (!isValidId(req.params.profileId)) {
            return res.status(400).json({ message: 'INVALID_ID' });
        }
        await moderation.unblock(req.user.id, req.params.profileId);
        res.json({ success: true });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
