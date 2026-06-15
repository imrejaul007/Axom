/**
 * REZ Trust OS - Fraud Routes
 * @module routes/fraud
 */

import { Router } from 'express';
import { z } from 'zod';
import { FraudService } from '../services/fraudService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

// Validation schemas
const userIdSchema = z.object({
  userId: z.string().min(1),
});

const fraudCheckSchema = z.object({
  body: z.object({
    userId: z.string().min(1),
    location: z.string().optional(),
    deviceId: z.string().optional(),
    ip: z.string().optional(),
    userAgent: z.string().optional(),
  }),
});

/**
 * POST /api/fraud/check
 * Check for fraud
 */
router.post(
  '/check',
  validateRequest(fraudCheckSchema),
  asyncHandler(async (req, res) => {
    const { userId, ...metadata } = req.body;
    const fraudCheck = FraudService.check(userId, metadata);

    res.json({
      success: true,
      data: fraudCheck,
    });
  })
);

/**
 * GET /api/fraud/history/:userId
 * Get fraud history
 */
router.get(
  '/history/:userId',
  validateRequest({ params: userIdSchema }),
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const history = FraudService.getHistory(userId);

    res.json({
      success: true,
      data: history,
    });
  })
);

export { router as fraudRouter };