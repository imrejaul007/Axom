"use strict";
/**
 * Chat request routes (Sprint 12 — Female Safety Controls)
 *
 * GET  /requests              — receiver's inbox of pending requests
 * POST /requests/:id/accept   — accept a pending request → opens chat
 * POST /requests/:id/decline  — decline a pending request
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const MessageRequestService_1 = require("../services/MessageRequestService");
const router = (0, express_1.Router)();
const service = new MessageRequestService_1.MessageRequestService();
// Inbox — pending requests for the logged-in user
// RZ-B-M5 FIX: Added cursor-based pagination via cursor query param.
// RD-L-01 FIX: Validate cursor format (CUID or alphanumeric) to prevent injection.
router.get('/', auth_1.rendezAuth, async (req, res, next) => {
    try {
        const { cursor, limit } = req.query;
        // RD-L-01 FIX: Validate cursor is alphanumeric + hyphen/underscore only, max 50 chars
        const safeCursor = typeof cursor === 'string' && /^[a-zA-Z0-9_-]{1,50}$/.test(cursor)
            ? cursor
            : undefined;
        const take = typeof limit === 'string' ? Math.min(parseInt(limit, 10) || 20, 50) : 20;
        const result = await service.getInbox(req.user.id, safeCursor, take);
        res.json(result);
    }
    catch (err) {
        next(err);
    }
});
// Accept a request
router.post('/:requestId/accept', auth_1.rendezAuth, async (req, res, next) => {
    try {
        await service.acceptRequest(req.user.id, req.params.requestId);
        res.json({ ok: true, message: 'Request accepted — chat is now open' });
    }
    catch (err) {
        next(err);
    }
});
// Decline a request
router.post('/:requestId/decline', auth_1.rendezAuth, async (req, res, next) => {
    try {
        await service.declineRequest(req.user.id, req.params.requestId);
        res.json({ ok: true, message: 'Request declined' });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
