import { Router, Request, Response, NextFunction } from 'express';
import { feedService } from '../services/feedService.js';
import { CreatePostSchema } from '../types/index.js';
import { logger } from '../utils/logger.js';

const router = Router();

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// Create post
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.body;
    const validation = CreatePostSchema.safeParse(req.body);

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'userId is required' },
      });
    }

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

    const post = await feedService.createPost(userId, validation.data);

    logger.info('Post created', { postId: post._id });

    return res.status(201).json({
      success: true,
      data: post,
    });
  })
);

// Get feed
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId, type = 'home', communityId, latitude, longitude, radius, limit = '20', cursor } = req.query;

    const feed = await feedService.getFeed({
      type: type as 'home' | 'following' | 'community' | 'nearby',
      userId: userId as string,
      communityId: communityId as string,
      location: latitude && longitude ? {
        latitude: parseFloat(latitude as string),
        longitude: parseFloat(longitude as string),
        radius: radius ? parseFloat(radius as string) : undefined,
      } : undefined,
      limit: parseInt(limit as string, 10),
      cursor: cursor as string,
    });

    return res.json({
      success: true,
      data: feed,
    });
  })
);

// Get post by ID
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const post = await feedService.getPost(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Post not found' },
      });
    }

    return res.json({
      success: true,
      data: post,
    });
  })
);

// Update post
router.patch(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { userId, content, media } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'userId is required' },
      });
    }

    const post = await feedService.updatePost(id, userId, { content, media });

    if (!post) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Post not found' },
      });
    }

    return res.json({
      success: true,
      data: post,
    });
  })
);

// Delete post
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'userId is required' },
      });
    }

    const deleted = await feedService.deletePost(id, userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Post not found' },
      });
    }

    return res.json({
      success: true,
      data: { deleted: true },
    });
  })
);

// Like/unlike post
router.post(
  '/:id/like',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'userId is required' },
      });
    }

    const result = await feedService.likePost(id, userId);

    return res.json({
      success: true,
      data: result,
    });
  })
);

// Comment on post
router.post(
  '/:id/comment',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { userId, content } = req.body;

    if (!userId || !content) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'userId and content are required' },
      });
    }

    const comment = await feedService.commentOnPost(id, userId, content);

    return res.status(201).json({
      success: true,
      data: comment,
    });
  })
);

// Share post
router.post(
  '/:id/share',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'userId is required' },
      });
    }

    await feedService.sharePost(id, userId);

    return res.json({
      success: true,
      data: { shared: true },
    });
  })
);

// Get user posts
router.get(
  '/user/:userId',
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { limit = '20', offset = '0' } = req.query;

    const result = await feedService.getUserPosts(
      userId,
      parseInt(limit as string, 10),
      parseInt(offset as string, 10)
    );

    return res.json({
      success: true,
      data: {
        items: result.posts,
        total: result.total,
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
      },
    });
  })
);

export default router;