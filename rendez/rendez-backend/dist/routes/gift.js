"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const GiftService_1 = require("../services/GiftService");
const rateLimiter_1 = require("../middleware/rateLimiter");
const client_1 = require("@prisma/client");
const errorHandler_1 = require("../middleware/errorHandler");
const database_1 = require("../config/database");
const partnerAudit_1 = require("../middleware/partnerAudit");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const giftService = new GiftService_1.GiftService();
function isValidId(id) {
    return /^c[a-z0-9]{24,}$/.test(id) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}
const sendGiftSchema = zod_1.z.object({
    receiverId: zod_1.z.string().cuid('Invalid receiverId'),
    matchId: zod_1.z.string().cuid('Invalid matchId'),
    giftType: zod_1.z.nativeEnum(client_1.GiftType),
    amountPaise: zod_1.z.number().int().positive().max(500000, 'Amount too large'),
    rezCatalogItemId: zod_1.z.string().optional(),
    message: zod_1.z.string().max(200).optional(),
});
router.get('/catalog', auth_1.rendezAuth, async (req, res, next) => {
    try {
        const items = await giftService.getCatalog(req.query.city);
        res.json(items);
    }
    catch (err) {
        next(err);
    }
});
router.post('/send', auth_1.rendezAuth, rateLimiter_1.giftLimiter, rateLimiter_1.giftPairLimiter, (0, partnerAudit_1.auditPartnerCall)('gift:send'), async (req, res, next) => {
    try {
        const { receiverId, matchId, giftType, amountPaise, rezCatalogItemId, message } = sendGiftSchema.parse(req.body);
        const [senderProfile, receiverProfile] = await Promise.all([
            database_1.prisma.profile.findUnique({ where: { id: req.user.id }, select: { rezUserId: true } }),
            database_1.prisma.profile.findUnique({ where: { id: receiverId }, select: { rezUserId: true } }),
        ]);
        if (!senderProfile || !receiverProfile)
            throw new errorHandler_1.AppError(404, 'Profile not found');
        // H-2 FIX: null-check rezUserId before proceeding — a profile may exist without
        // a linked REZ account if the account was created via an admin path.
        if (!senderProfile.rezUserId)
            throw new errorHandler_1.AppError(422, 'Sender REZ account not linked');
        if (!receiverProfile.rezUserId)
            throw new errorHandler_1.AppError(422, 'Receiver REZ account not linked');
        const gift = await giftService.sendGift({
            senderId: req.user.id,
            receiverId,
            matchId,
            giftType: giftType,
            amountPaise,
            rezCatalogItemId,
            message,
            senderRezId: senderProfile.rezUserId,
            receiverRezId: receiverProfile.rezUserId,
        });
        res.status(201).json(gift);
    }
    catch (err) {
        next(err);
    }
});
router.post('/:giftId/accept', auth_1.rendezAuth, (0, partnerAudit_1.auditPartnerCall)('gift:accept'), async (req, res, next) => {
    try {
        if (!isValidId(req.params.giftId))
            return res.status(400).json({ message: 'INVALID_ID' });
        const profile = await database_1.prisma.profile.findUnique({ where: { id: req.user.id }, select: { rezUserId: true } });
        if (!profile)
            throw new errorHandler_1.AppError(404, 'Profile not found');
        // H-2 FIX: guard against missing rezUserId before passing to REZ wallet
        if (!profile.rezUserId)
            throw new errorHandler_1.AppError(422, 'REZ account not linked — cannot accept gift');
        const result = await giftService.acceptGift(req.user.id, req.params.giftId, profile.rezUserId);
        res.json(result);
    }
    catch (err) {
        next(err);
    }
});
router.post('/:giftId/reject', auth_1.rendezAuth, (0, partnerAudit_1.auditPartnerCall)('gift:reject'), async (req, res, next) => {
    try {
        if (!isValidId(req.params.giftId))
            return res.status(400).json({ message: 'INVALID_ID' });
        await giftService.rejectGift(req.user.id, req.params.giftId);
        res.json({ success: true });
    }
    catch (err) {
        next(err);
    }
});
router.get('/:giftId/voucher', auth_1.rendezAuth, async (req, res, next) => {
    try {
        if (!isValidId(req.params.giftId))
            return res.status(400).json({ message: 'INVALID_ID' });
        const voucher = await giftService.getVoucher(req.user.id, req.params.giftId);
        res.json(voucher);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
