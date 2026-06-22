import { Router, Response } from 'express';
import { communityService } from '../services/communityService.js';
import { internalAuth, AuthRequest, requireUserId } from '../middleware/auth.js';

const router = Router();

router.use(internalAuth);

/**
 * GET /communities/:id/posts
 * Get community posts
 */
router.get('/:id/posts', async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit } = req.query;

    const result = await communityService.getCommunityPosts(
      req.params.id,
      page ? parseInt(page as string) : 1,
      limit ? parseInt(limit as string) : 20
    );

    res.json(result);
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

/**
 * POST /communities/:id/posts
 * Create community post
 */
router.post('/:id/posts', requireUserId, async (req: AuthRequest, res: Response) => {
  try {
    const { content, media } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content required' });
    }

    const post = await communityService.createPost({
      communityId: req.params.id,
      authorId: req.userId!,
      content,
      media,
    });

    res.status(201).json(post);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: error.message || 'Failed to create post' });
  }
});

export default router;
