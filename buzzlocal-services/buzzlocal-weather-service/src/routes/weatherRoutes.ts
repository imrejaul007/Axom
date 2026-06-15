import { Router, Response } from 'express';
import { weatherService } from '../services/weatherService.js';
import { internalAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.use(internalAuth);

/**
 * GET /weather/current
 * Get current weather for location
 */
router.get('/current', async (req: AuthRequest, res: Response) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng required' });
    }

    const weather = await weatherService.getCurrentWeather(
      parseFloat(lat as string),
      parseFloat(lng as string)
    );

    if (!weather) {
      return res.status(503).json({ error: 'Weather service unavailable' });
    }

    res.json({ weather });
  } catch (error) {
    console.error('Weather error:', error);
    res.status(500).json({ error: 'Failed to get weather' });
  }
});

/**
 * GET /weather/insights
 * Get weather-based insights for location
 */
router.get('/insights', async (req: AuthRequest, res: Response) => {
  try {
    const { lat, lng, area, city } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng required' });
    }

    const insights = await weatherService.getInsights(
      parseFloat(lat as string),
      parseFloat(lng as string),
      (area as string) || 'Unknown',
      (city as string) || 'Unknown'
    );

    res.json({ insights });
  } catch (error) {
    console.error('Insights error:', error);
    res.status(500).json({ error: 'Failed to get insights' });
  }
});

/**
 * GET /weather/history
 * Get weather history for city
 */
router.get('/history', async (req: AuthRequest, res: Response) => {
  try {
    const { city, hours } = req.query;

    if (!city) {
      return res.status(400).json({ error: 'city required' });
    }

    const history = await weatherService.getWeatherHistory(
      city as string,
      hours ? parseInt(hours as string) : 24
    );

    res.json({ history });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ error: 'Failed to get history' });
  }
});

/**
 * GET /weather/stats
 * Get weather statistics for city
 */
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const { city } = req.query;

    if (!city) {
      return res.status(400).json({ error: 'city required' });
    }

    const stats = await weatherService.getWeatherStats(city as string);

    res.json({ stats });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

export default router;
