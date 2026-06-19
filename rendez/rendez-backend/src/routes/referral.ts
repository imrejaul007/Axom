/**
 * Referral routes
 * Base path: /api/v1/referral
 */

import { Router, Response, NextFunction } from 'express';
import { rendezAuth, AuthRequest } from '../middleware/auth';
import { ReferralService } from '../services/ReferralService';
import { prisma } from '../config/database';
import { redis } from '../config/redis';

const router = Router();
const service = new ReferralService();

// GET /api/v1/referral/my-code — get own invite code + share link
router.get('/my-code', rendezAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await service.getMyCode(req.user!.id);
    res.json(result);
  } catch (err) { next(err); }
});

// POST /api/v1/referral/apply — apply an invite code (called after profile creation if code was in deep link)
router.post('/apply', rendezAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // RD-L-02 FIX: Validate referral code format — must be alphanumeric, 6-20 chars.
    const { code } = req.body as { code?: string };
    if (!code || typeof code !== 'string' || !/^[A-Za-z0-9]{6,20}$/.test(code)) {
      res.status(400).json({ message: 'code must be a 6-20 character alphanumeric string' }); return;
    }

    // RZ-B-L7 FIX: Use Redis-backed idempotency key with a short TTL to prevent
    // both accidental double-submits and a client easily bypassing the header check.
    const idempotencyKey = req.headers['idempotency-key'] as string;
    if (idempotencyKey) {
      const lockKey = `referral_apply:${req.user!.id}:${idempotencyKey}`;
      const existing = await redis.get(lockKey);
      if (existing) {
        res.json({ applied: true, alreadyApplied: true });
        return;
      }
      // Check DB as fallback
      const profile = await prisma.profile.findFirst({
        where: { id: req.user!.id, referredBy: code },
      });
      if (profile) {
        // Cache the result in Redis for fast-path on retries
        await redis.setex(lockKey, 3600, '1');
        res.json({ applied: true, alreadyApplied: true });
        return;
      }
    }

    await service.applyCode(req.user!.id, code);

    // Stamp the idempotency result
    if (idempotencyKey) {
      await redis.setex(`referral_apply:${req.user!.id}:${idempotencyKey}`, 3600, '1');
    }

    res.json({ applied: true });
  } catch (err) { next(err); }
});

export default router;
