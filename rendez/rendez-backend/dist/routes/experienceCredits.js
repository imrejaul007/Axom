"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const ExperienceCreditService_1 = require("../services/ExperienceCreditService");
const crypto_1 = __importDefault(require("crypto"));
const express_2 = __importDefault(require("express"));
const zod_1 = require("zod");
const env_1 = require("../config/env");
const router = (0, express_1.Router)();
const service = new ExperienceCreditService_1.ExperienceCreditService();
// RZ-B-H1 FIX: REZ_SECRET must be validated at module load — if undefined, the HMAC
// verification silently fails and the endpoint returns 401 for all valid requests.
const REZ_SECRET = env_1.env.REZ.WEBHOOK_SECRET;
// RD-L-04 FIX: Zod schema for HMAC-verified webhook payload.
// Without this, arbitrary keys in req.body could be passed through to Prisma create()
// even after HMAC verification (e.g., unexpected fields or wrong types).
const grantWebhookSchema = zod_1.z.object({
    rezRewardId: zod_1.z.string().min(1),
    rezUserId: zod_1.z.string().min(1),
    tier: zod_1.z.enum(['SILVER', 'GOLD', 'PLATINUM']),
    type: zod_1.z.enum(['COFFEE_BRUNCH', 'DINNER_FOR_TWO', 'PREMIUM_EXPERIENCE']),
    label: zod_1.z.string().min(1),
    expiresAt: zod_1.z.string().datetime(),
});
if (!REZ_SECRET) {
    throw new Error('[FATAL] REZ.WEBHOOK_SECRET environment variable is not set — webhook endpoint will reject all requests');
}
// GET /api/v1/experience-credits — user's full credits wallet
router.get('/', auth_1.rendezAuth, async (req, res, next) => {
    try {
        const credits = await service.getAll(req.user.id);
        res.json({ credits });
    }
    catch (err) {
        next(err);
    }
});
// GET /api/v1/experience-credits/available — available credits only
router.get('/available', auth_1.rendezAuth, async (req, res, next) => {
    try {
        const credits = await service.getAvailable(req.user.id);
        res.json({ credits });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/v1/experience-credits/grant — called by REZ backend (HMAC-verified)
router.post('/grant', express_2.default.json({
    verify: (req, _res, buf) => { req.rawBody = buf.toString('utf8'); },
}), async (req, res, next) => {
    try {
        const sig = (req.headers['x-rez-signature'] || '').replace('sha256=', '');
        const expected = crypto_1.default.createHmac('sha256', REZ_SECRET).update(req.rawBody).digest('hex');
        // timingSafeEqual throws if the two buffers have different byte lengths (e.g. when
        // the sender sends a malformed or zero-length hex string). Wrap in try/catch so a bad
        // signature returns 401 instead of propagating a 500 TypeError.
        let sigValid = false;
        try {
            sigValid = !!(REZ_SECRET && crypto_1.default.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex')));
        }
        catch {
            sigValid = false;
        }
        if (!sigValid) {
            res.status(401).json({ message: 'Invalid signature' });
            return;
        }
        // RD-L-04 FIX: Validate webhook payload with Zod before processing.
        // Rejects malformed bodies (wrong types, missing fields, extra unexpected fields).
        const parsed = grantWebhookSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ message: 'Invalid payload', details: parsed.error.flatten() });
            return;
        }
        const { rezRewardId, rezUserId, tier, type, label, expiresAt } = parsed.data;
        const credit = await service.grant({ rezRewardId, rezUserId, tier, type, label, expiresAt: new Date(expiresAt) });
        res.status(201).json({ credit, creditId: credit.id });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
