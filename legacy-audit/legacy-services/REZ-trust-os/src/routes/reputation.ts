/**
 * REZ Trust OS - Reputation Routes
 * @module routes/reputation
 */

import { Router } from 'express';
import { z } from 'zod';
import { ReputationService } from '../services/reputationService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

// Validation schemas
const userIdSchema = z.object({
  userId: z.string().min(1),
});

const reviewSchema = z.object({
  body: z.object({
    userId: z.string().min(1),
    rating: z.number().min(1).max(5),
  }),
});

const badgeSchema = z.object({
  body: z.object({
    userId: z.string().min(1),
    badge: z.string().min(1),
  }),
});

/**
 * GET /api/reputation/:userId
 * Get reputation score
 */
router.get(
  '/:userId',
  validateRequest({ params: userIdSchema }),
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    let reputation = ReputationService.getScore(userId);

    if (!reputation) {
      reputation = ReputationService.initialize(userId);
    }

    res.json({
      success: true,
      data: reputation,
    });
  })
);

/**
 * POST /api/reputation/review
 * Add a review
 */
router.post(
  '/review',
  validateRequest(reviewSchema),
  asyncHandler(async (req, res) => {
    const { userId, rating } = req.body;
    const reputation = ReputationService.addReview(userId, rating);

    res.json({
      success: true,
      data: reputation,
    });
  })
);

/**
 * POST /api/reputation/badge
 * Add a badge
 */
router.post(
  '/badge',
  validateRequest(badgeSchema),
  asyncHandler(async (req, res) => {
    const { userId, badge } = req.body;
    const reputation = ReputationService.addBadge(userId, badge);

    res.json({
      success: true,
      data: reputation,
    });
  })
);

/**
 * DELETE /api/reputation/badge
 * Remove a badge
 */
router.delete(
  '/badge',
  validateRequest(badgeSchema),
  asyncHandler(async (req, res) => {
    const { userId, badge } = req.body;
    const reputation = ReputationService.removeBadge(userId, badge);

    res.json({
      success: true,
      data: reputation,
    });
  })
);

export { router as reputationRouter };