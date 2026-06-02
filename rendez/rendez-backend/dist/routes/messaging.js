"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const MessagingService_1 = require("../services/MessagingService");
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../config/logger");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const intentCapture_service_1 = require("../services/intentCapture.service");
// 60 messages per user per minute — prevents flooding outside the state machine
const messageLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 60,
    keyGenerator: (req) => req.user?.id || req.ip || 'anon',
    message: { message: 'MESSAGE_RATE_LIMIT', details: 'Slow down — maximum 60 messages per minute' },
});
const router = (0, express_1.Router)();
const messaging = new MessagingService_1.MessagingService();
function isValidId(id) {
    // CUID: starts with 'c', alphanumeric, ~25 chars
    // UUID: 8-4-4-4-12 hex pattern
    return /^c[a-z0-9]{24,}$/.test(id) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}
router.get('/:matchId/messages', auth_1.rendezAuth, async (req, res, next) => {
    try {
        if (!isValidId(req.params.matchId)) {
            return res.status(400).json({ message: 'INVALID_ID' });
        }
        const result = await messaging.getMessages(req.user.id, req.params.matchId, req.query.cursor);
        res.json(result);
    }
    catch (err) {
        next(err);
    }
});
router.post('/:matchId/messages', auth_1.rendezAuth, messageLimiter, async (req, res, next) => {
    try {
        if (!isValidId(req.params.matchId)) {
            return res.status(400).json({ message: 'INVALID_ID' });
        }
        const { content } = req.body;
        if (!content?.trim())
            throw new errorHandler_1.AppError(400, 'Message content required');
        const message = await messaging.sendMessage(req.user.id, req.params.matchId, content.trim());
        // RTMN Commerce Memory: Capture message sent intent (non-blocking)
        (0, intentCapture_service_1.captureMessageSent)({
            userId: req.user.id,
            matchId: req.params.matchId,
            messageId: message.id,
            content: content.trim(),
        }).catch((err) => logger_1.logger.warn('[IntentCapture] Failed to capture message sent', { error: err, messageId }));
        res.status(201).json(message);
    }
    catch (err) {
        next(err);
    }
});
router.get('/:matchId/state', auth_1.rendezAuth, async (req, res, next) => {
    try {
        if (!isValidId(req.params.matchId)) {
            return res.status(400).json({ message: 'INVALID_ID' });
        }
        const match = await database_1.prisma.match.findFirst({
            where: { id: req.params.matchId, OR: [{ user1Id: req.user.id }, { user2Id: req.user.id }] },
            include: { messageState: true },
        });
        if (!match)
            throw new errorHandler_1.AppError(404, 'Match not found');
        res.json({ state: match.messageState?.state, giftUnlockCount: match.messageState?.giftUnlockCount });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
