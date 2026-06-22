/**
 * REZ Trust OS - Trust Routes
 * @module routes/trust
 */

import { Router } from 'express';
import { z } from 'zod';
import { TrustScoreService } from '../services/trustScoreService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

// Validation schemas
const userIdSchema = z.object({
  userId: z.string().min(1),
});

const updateScoreSchema = z.object({
  body: z.object({
    userId: z.string().min(1),
    identity: z.number().min(0).max(100).optional(),
    behavior: z.number().min(0).max(100).optional(),
    activity: z.number().min(0).max(100).optional(),
    verification: z.number().min(0).max(100).optional(),
    history: z.number().min(0).max(100).optional(),
    reason: z.string().min(1),
  }),
});

/**
 * GET /api/trust/score/:userId
 * Get trust score for a user
 */
router.get(
  '/score/:userId',
  validateRequest({ params: userIdSchema }),
  asyncHandler(async (req, res) => {
    const { userId } = req.params;

    let score = TrustScoreService.getScore(userId);

    if (!score) {
      score = TrustScoreService.initialize(userId);
    }

    res.json({
      success: true,
      data: score,
    });
  })
);

/**
 * POST /api/trust/score
 * Update trust score
 */
router.post(
  '/score',
  validateRequest(updateScoreSchema),
  asyncHandler(async (req, res) => {
    const { userId, reason, ...changes } = req.body;

    const score = TrustScoreService.updateScore(userId, changes, reason);

    res.json({
      success: true,
      data: score,
    });
  })
);

/**
 * GET /api/trust/history/:userId
 * Get trust score history
 */
router.get(
  '/history/:userId',
  validateRequest({ params: userIdSchema }),
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const history = TrustScoreService.getHistory(userId);

    res.json({
      success: true,
      data: history,
    });
  })
);

export { router as trustRouter };