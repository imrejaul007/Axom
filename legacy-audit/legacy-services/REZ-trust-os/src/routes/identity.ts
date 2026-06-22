/**
 * REZ Trust OS - Identity Routes
 * @module routes/identity
 */

import { Router } from 'express';
import { z } from 'zod';
import { IdentityService } from '../services/identityService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { KycLevel } from '../types.js';

const router = Router();

// Validation schemas
const userIdSchema = z.object({
  userId: z.string().min(1),
});

const verifySchema = z.object({
  body: z.object({
    userId: z.string().min(1),
    level: z.nativeEnum(KycLevel),
  }),
});

const kycSchema = z.object({
  body: z.object({
    userId: z.string().min(1),
    documents: z.array(z.string()).min(1),
  }),
});

/**
 * GET /api/identity/:userId
 * Get identity status
 */
router.get(
  '/:userId',
  validateRequest({ params: userIdSchema }),
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const identity = IdentityService.getStatus(userId);

    res.json({
      success: true,
      data: identity || {
        userId,
        status: 'not_started',
        kycLevel: 0,
      },
    });
  })
);

/**
 * POST /api/identity/verify
 * Verify user identity
 */
router.post(
  '/verify',
  validateRequest(verifySchema),
  asyncHandler(async (req, res) => {
    const { userId, level } = req.body;
    const identity = IdentityService.verify(userId, level);

    res.json({
      success: true,
      data: identity,
    });
  })
);

/**
 * POST /api/identity/kyc
 * Submit KYC data
 */
router.post(
  '/kyc',
  validateRequest(kycSchema),
  asyncHandler(async (req, res) => {
    const { userId, documents } = req.body;
    const identity = IdentityService.submitKyc(userId, documents);

    res.json({
      success: true,
      data: identity,
    });
  })
);

export { router as identityRouter };