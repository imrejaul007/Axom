import { Router, Response, NextFunction } from 'express';
import { rendezAuth, AuthRequest } from '../middleware/auth';
import { ExperienceCreditService } from '../services/ExperienceCreditService';
import crypto from 'crypto';
import express from 'express';
import { z } from 'zod';
import { env } from '../config/env';

const router  = Router();
const service = new ExperienceCreditService();
// RZ-B-H1 FIX: REZ_SECRET must be validated at module load — if undefined, the HMAC
// verification silently fails and the endpoint returns 401 for all valid requests.
const REZ_SECRET = env.REZ.WEBHOOK_SECRET;

// RD-L-04 FIX: Zod schema for HMAC-verified webhook payload.
// Without this, arbitrary keys in req.body could be passed through to Prisma create()
// even after HMAC verification (e.g., unexpected fields or wrong types).
const grantWebhookSchema = z.object({
  rezRewardId: z.string().min(1),
  rezUserId:   z.string().min(1),
  tier:        z.enum(['SILVER', 'GOLD', 'PLATINUM']),
  type:        z.enum(['COFFEE_BRUNCH', 'DINNER_FOR_TWO', 'PREMIUM_EXPERIENCE']),
  label:       z.string().min(1),
  expiresAt:   z.string().datetime(),
});
if (!REZ_SECRET) {
  throw new Error('[FATAL] REZ.WEBHOOK_SECRET environment variable is not set — webhook endpoint will reject all requests');
}

// GET /api/v1/experience-credits — user's full credits wallet
router.get('/', rendezAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const credits = await service.getAll(req.user!.id);
    res.json({ credits });
  } catch (err) { next(err); }
});

// GET /api/v1/experience-credits/available — available credits only
router.get('/available', rendezAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const credits = await service.getAvailable(req.user!.id);
    res.json({ credits });
  } catch (err) { next(err); }
});

// POST /api/v1/experience-credits/grant — called by REZ backend (HMAC-verified)
router.post('/grant', express.json({
  verify: (req: any, _res, buf) => { req.rawBody = buf.toString('utf8'); },
}), async (req: any, res: Response, next: NextFunction) => {
  try {
    const sig      = (req.headers['x-rez-signature'] as string || '').replace('sha256=', '');
    const expected = crypto.createHmac('sha256', REZ_SECRET).update(req.rawBody).digest('hex');
    // timingSafeEqual throws if the two buffers have different byte lengths (e.g. when
    // the sender sends a malformed or zero-length hex string). Wrap in try/catch so a bad
    // signature returns 401 instead of propagating a 500 TypeError.
    let sigValid = false;
    try {
      sigValid = !!(REZ_SECRET && crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex')));
    } catch {
      sigValid = false;
    }
    if (!sigValid) {
      res.status(401).json({ message: 'Invalid signature' }); return;
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
  } catch (err) { next(err); }
});

export default router;
