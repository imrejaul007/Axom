import { Router, Response } from 'express';
import { feedService } from '../services/feedService.js';
import { analyticsService } from '../services/analyticsService.js';
import { internalAuth, AuthRequest, requireUserId } from '../middleware/auth.js';

const router = Router();

router.use(internalAuth);

/**
 * GET /posts/:id
 * Get single post
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const post = await feedService.getPost(req.params.id, req.userId);
    res.json(post);
  } catch (error) {
    console.error('Get post error:', error);
    res.status(404).json({ error: error.message || 'Post not found' });
  }
});

/**
 * POST /posts
 * Create new post
 */
router.post('/', requireUserId, async (req: AuthRequest, res: Response) => {
  try {
    const { type, content, media, location, tags, eventDate, alertCategory, alertSeverity, pollOptions } = req.body;

    if (!type || !content) {
      return res.status(400).json({ error: 'Type and content required' });
    }

    const post = await feedService.createPost({
      type,
      authorId: req.userId!,
      content,
      media,
      location,
      tags,
      eventDate,
      alertCategory,
      alertSeverity,
      pollOptions,
    });

    // Track analytics
    analyticsService.track('post_create', {
      postType: type,
      hasLocation: !!location,
      hasMedia: !!media?.length,
    }).catch(() => {});

    res.status(201).json(post);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: error.message || 'Failed to create post' });
  }
});

/**
 * POST /posts/:id/like
 * Like a post
 */
router.post('/:id/like', requireUserId, async (req: AuthRequest, res: Response) => {
  try {
    const result = await feedService.likePost(req.params.id, req.userId!);

    analyticsService.track('post_like', {
      postId: req.params.id,
    }).catch(() => {});

    res.json(result);
  } catch (error) {
    console.error('Like error:', error);
    res.status(500).json({ error: error.message || 'Failed to like post' });
  }
});

/**
 * DELETE /posts/:id/like
 * Unlike a post
 */
router.delete('/:id/like', requireUserId, async (req: AuthRequest, res: Response) => {
  try {
    const result = await feedService.likePost(req.params.id, req.userId!);
    res.json(result);
  } catch (error) {
    console.error('Unlike error:', error);
    res.status(500).json({ error: error.message || 'Failed to unlike post' });
  }
});

/**
 * POST /posts/:id/save
 * Save a post
 */
router.post('/:id/save', requireUserId, async (req: AuthRequest, res: Response) => {
  try {
    const result = await feedService.savePost(req.params.id, req.userId!);

    if (result.saved) {
      analyticsService.track('post_save', {
        postId: req.params.id,
      }).catch(() => {});
    }

    res.json(result);
  } catch (error) {
    console.error('Save error:', error);
    res.status(500).json({ error: error.message || 'Failed to save post' });
  }
});

/**
 * POST /posts/:id/vote
 * Vote on a poll
 */
router.post('/:id/vote', requireUserId, async (req: AuthRequest, res: Response) => {
  try {
    const { optionIndex } = req.body;

    if (optionIndex === undefined) {
      return res.status(400).json({ error: 'Option index required' });
    }

    const result = await feedService.votePoll(req.params.id, optionIndex, req.userId!);
    res.json(result);
  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({ error: error.message || 'Failed to vote' });
  }
});

export default router;
