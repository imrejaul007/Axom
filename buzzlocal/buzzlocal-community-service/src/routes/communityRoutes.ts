import { Router, Request, Response, NextFunction } from 'express';
import { communityService } from '../services/communityService.js';
import { CreateCommunitySchema, UpdateCommunitySchema, AddMemberSchema } from '../types/index.js';
import { logger } from '../utils/logger.js';

const router = Router();

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// Create community
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const validation = CreateCommunitySchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: validation.error.issues,
        },
      });
    }

    const community = await communityService.createCommunity(validation.data);

    logger.info('Community created', { communityId: community._id });

    return res.status(201).json({
      success: true,
      data: community,
    });
  })
);

// List communities
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { limit = '20', offset = '0', search, isPrivate } = req.query;

    const result = await communityService.listCommunities({
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
      search: search as string,
      isPrivate: isPrivate === 'true' ? true : isPrivate === 'false' ? false : undefined,
    });

    return res.json({
      success: true,
      data: {
        items: result.items,
        total: result.total,
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
        hasMore: parseInt(offset as string, 10) + result.items.length < result.total,
      },
    });
  })
);

// Get community by ID
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const community = await communityService.getCommunity(id);

    if (!community) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Community not found',
        },
      });
    }

    return res.json({
      success: true,
      data: community,
    });
  })
);

// Update community
router.patch(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const validation = UpdateCommunitySchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: validation.error.issues,
        },
      });
    }

    const community = await communityService.updateCommunity(id, validation.data);

    if (!community) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Community not found',
        },
      });
    }

    return res.json({
      success: true,
      data: community,
    });
  })
);

// Delete community
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'userId is required',
        },
      });
    }

    const deleted = await communityService.deleteCommunity(id, userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Community not found',
        },
      });
    }

    return res.json({
      success: true,
      data: { deleted: true },
    });
  })
);

// Add member
router.post(
  '/:id/members',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const validation = AddMemberSchema.safeParse({ ...req.body, communityId: id });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: validation.error.issues,
        },
      });
    }

    try {
      const member = await communityService.addMember(id, validation.data.userId, validation.data.role);

      return res.status(201).json({
        success: true,
        data: member,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(400).json({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message,
        },
      });
    }
  })
);

// Get members
router.get(
  '/:id/members',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { limit = '50', offset = '0', role, status } = req.query;

    const result = await communityService.getMembers(id, {
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
      role: role as string,
      status: status as string,
    });

    return res.json({
      success: true,
      data: {
        items: result.items,
        total: result.total,
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
        hasMore: parseInt(offset as string, 10) + result.items.length < result.total,
      },
    });
  })
);

// Remove member
router.delete(
  '/:id/members/:userId',
  asyncHandler(async (req: Request, res: Response) => {
    const { id, userId } = req.params;
    const { removedBy, reason } = req.body;

    try {
      await communityService.removeMember(id, userId, removedBy || 'system', reason);

      return res.json({
        success: true,
        data: { removed: true },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(400).json({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message,
        },
      });
    }
  })
);

// Get activities
router.get(
  '/:id/activities',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { limit = '50', offset = '0', action } = req.query;

    const result = await communityService.getActivities(id, {
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
      action: action as string,
    });

    return res.json({
      success: true,
      data: {
        items: result.items,
        total: result.total,
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
        hasMore: parseInt(offset as string, 10) + result.items.length < result.total,
      },
    });
  })
);

// Get user communities
router.get(
  '/users/:userId/communities',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { limit = '20', offset = '0' } = req.query;

    const result = await communityService.getUserCommunities(userId, {
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    });

    return res.json({
      success: true,
      data: {
        items: result.items,
        total: result.total,
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
        hasMore: parseInt(offset as string, 10) + result.items.length < result.total,
      },
    });
  })
);

export default router;