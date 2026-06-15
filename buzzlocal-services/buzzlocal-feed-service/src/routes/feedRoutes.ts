import { Router, Response } from 'express';
import { feedService } from '../services/feedService.js';
import { analyticsService } from '../services/analyticsService.js';
import { internalAuth, AuthRequest, requireUserId } from '../middleware/auth.js';

const router = Router();

// Apply internal auth to all routes
router.use(internalAuth);

/**
 * GET /feed
 * Get personalized feed
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, lat, lng, radius, types, tags } = req.query;

    const result = await feedService.getFeed({
      userId: req.userId,
      latitude: lat ? parseFloat(lat as string) : undefined,
      longitude: lng ? parseFloat(lng as string) : undefined,
      radius: radius ? parseInt(radius as string) : 10000,
      types: types ? (types as string).split(',') as unknown : undefined,
      tags: tags ? (tags as string).split(',') : undefined,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    });

    // Track analytics
    analyticsService.track('map_view', {
      feedType: 'home',
    }).catch(() => {});

    res.json(result);
  } catch (error) {
    console.error('Feed error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch feed' });
  }
});

/**
 * GET /feed/ai-cards
 * Get AI cards for the feed
 */
router.get('/ai-cards', async (req: AuthRequest, res: Response) => {
  try {
    const { lat, lng } = req.query;

    const cards = await feedService.getAICards(
      lat ? parseFloat(lat as string) : undefined,
      lng ? parseFloat(lng as string) : undefined
    );

    res.json({ cards });
  } catch (error) {
    console.error('AI cards error:', error);
    res.status(500).json({ error: 'Failed to fetch AI cards' });
  }
});

/**
 * GET /posts/search
 * Search posts
 */
router.get('/posts/search', async (req: AuthRequest, res: Response) => {
  try {
    const { q, type, lat, lng, radius } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Query required' });
    }

    const posts = await feedService.searchPosts(q as string, {
      type: type as unknown,
      latitude: lat ? parseFloat(lat as string) : undefined,
      longitude: lng ? parseFloat(lng as string) : undefined,
      radius: radius ? parseInt(radius as string) : 10000,
    });

    res.json({ posts });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
