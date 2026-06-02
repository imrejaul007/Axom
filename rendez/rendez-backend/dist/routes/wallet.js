"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const rezWalletClient_1 = require("../integrations/rez/rezWalletClient");
const partnerAudit_1 = require("../middleware/partnerAudit");
const router = (0, express_1.Router)();
// RZ-B-C3 FIX: Validate query enum params before use. The `as any` bypasses TypeScript
// and could pass invalid values to Prisma or downstream logic.
const GIFT_STATUS_VALUES = ['PENDING', 'ACCEPTED', 'REJECTED', 'REDEEMED', 'EXPIRED'];
const GIFT_TYPE_VALUES = ['COIN', 'MERCHANT_VOUCHER'];
function toEnum(val, allowed) {
    if (!val)
        return undefined;
    return allowed.includes(val) ? val : undefined;
}
// GET /api/v1/wallet/balance — proxy to REZ
router.get('/balance', auth_1.rendezAuth, (0, partnerAudit_1.auditPartnerCall)('wallet:balance'), async (req, res, next) => {
    try {
        const profile = await database_1.prisma.profile.findUnique({
            where: { id: req.user.id },
            select: { rezUserId: true },
        });
        if (!profile)
            throw new errorHandler_1.AppError(404, 'Profile not found');
        if (!profile.rezUserId)
            throw new errorHandler_1.AppError(422, 'REZ account not linked — cannot fetch balance');
        const balance = await (0, rezWalletClient_1.getBalance)(profile.rezUserId);
        res.json(balance);
    }
    catch (err) {
        next(err);
    }
});
// GET /api/v1/wallet/gifts — received gifts
router.get('/gifts', auth_1.rendezAuth, async (req, res, next) => {
    try {
        // RZ-B-C3 FIX: Validate enum params explicitly instead of casting to `any`.
        // Invalid values are silently dropped (returning all gifts) rather than crashing.
        const status = toEnum(req.query.status, GIFT_STATUS_VALUES);
        const giftType = toEnum(req.query.type, GIFT_TYPE_VALUES);
        const gifts = await database_1.prisma.gift.findMany({
            where: {
                receiverId: req.user.id,
                ...(status && { status }),
                ...(giftType && { giftType }),
            },
            include: {
                sender: { select: { name: true, photos: true } },
                match: { select: { id: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        res.json(gifts);
    }
    catch (err) {
        next(err);
    }
});
// GET /api/v1/wallet/gifts/sent — gifts I sent
router.get('/gifts/sent', auth_1.rendezAuth, async (req, res, next) => {
    try {
        const gifts = await database_1.prisma.gift.findMany({
            where: { senderId: req.user.id },
            include: {
                receiver: { select: { name: true, photos: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        res.json(gifts);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
