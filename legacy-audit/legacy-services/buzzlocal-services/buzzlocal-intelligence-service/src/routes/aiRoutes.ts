import { Router, Response } from 'express';
import { intelligenceService } from '../services/intelligenceService.js';
import { internalAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.use(internalAuth);

/**
 * GET /ai/cards
 * Get AI cards for the feed
 */
router.get('/cards', async (req: AuthRequest, res: Response) => {
  try {
    const { userId, lat, lng, area, city } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    const cards = await intelligenceService.getAICards(userId as string, {
      latitude: lat ? parseFloat(lat as string) : 12.9716,
      longitude: lng ? parseFloat(lng as string) : 77.5946,
      area: area as string,
      city: city as string,
    });

    res.json({ cards });
  } catch (error) {
    console.error('AI cards error:', error);
    res.status(500).json({ error: 'Failed to generate AI cards' });
  }
});

/**
 * GET /ai/feed
 * Get personalized feed recommendations
 */
router.get('/feed', async (req: AuthRequest, res: Response) => {
  try {
    const { userId, lat, lng, area, city, limit } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    const items = await intelligenceService.getPersonalizedFeed(
      userId as string,
      {
        latitude: lat ? parseFloat(lat as string) : 12.9716,
        longitude: lng ? parseFloat(lng as string) : 77.5946,
        area: area as string,
        city: city as string,
      },
      limit ? parseInt(limit as string) : 10
    );

    res.json({ items });
  } catch (error) {
    console.error('Feed error:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

/**
 * POST /ai/track
 * Track user action for learning
 */
router.post('/track', async (req: AuthRequest, res: Response) => {
  try {
    const { userId, type, category, area, tags, lat, lng } = req.body;

    if (!userId || !type) {
      return res.status(400).json({ error: 'userId and type required' });
    }

    await intelligenceService.updateUserInterest(userId, {
      type,
      category,
      area,
      tags,
    });

    // Also track event
    await intelligenceService.trackEvent({
      type,
      userId,
      data: { category, tags },
      location: lat && lng ? { latitude: lat, longitude: lng, area } : undefined,
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Track error:', error);
    res.status(500).json({ error: 'Failed to track action' });
  }
});

/**
 * GET /ai/mood
 * Get area mood prediction
 */
router.get('/mood', async (req: AuthRequest, res: Response) => {
  try {
    const { lat, lng, area, city } = req.query;

    const mood = await intelligenceService.predictAreaMood({
      latitude: lat ? parseFloat(lat as string) : 12.9716,
      longitude: lng ? parseFloat(lng as string) : 77.5946,
      area: area as string,
      city: city as string,
    });

    res.json({ mood });
  } catch (error) {
    console.error('Mood error:', error);
    res.status(500).json({ error: 'Failed to predict mood' });
  }
});

/**
 * GET /ai/trending
 * Get trending topics
 */
router.get('/trending', async (req: AuthRequest, res: Response) => {
  try {
    const { lat, lng, area, city } = req.query;

    const topics = await intelligenceService.getTrendingTopics({
      latitude: lat ? parseFloat(lat as string) : 12.9716,
      longitude: lng ? parseFloat(lng as string) : 77.5946,
      area: area as string,
      city: city as string,
    });

    res.json({ trending: topics });
  } catch (error) {
    console.error('Trending error:', error);
    res.status(500).json({ error: 'Failed to get trending' });
  }
});

export default router;
