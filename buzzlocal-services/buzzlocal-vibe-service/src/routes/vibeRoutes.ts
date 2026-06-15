import { Router, Response } from 'express';
import { vibeService } from '../services/vibeService.js';
import { analyticsService } from '../services/analyticsService.js';
import { internalAuth, AuthRequest, requireUserId } from '../middleware/auth.js';

const router = Router();

router.use(internalAuth);

/**
 * GET /vibe/areas
 * Get nearby vibe areas
 */
router.get('/areas', async (req: AuthRequest, res: Response) => {
  try {
    const { lat, lng, radius } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Location required' });
    }

    const areas = await vibeService.getNearbyAreas(
      {
        latitude: parseFloat(lat as string),
        longitude: parseFloat(lng as string),
      },
      radius ? parseInt(radius as string) : 5000
    );

    res.json({ areas });
  } catch (error) {
    console.error('Get areas error:', error);
    res.status(500).json({ error: 'Failed to fetch areas' });
  }
});

/**
 * GET /vibe/areas/:id
 * Get single area
 */
router.get('/areas/:id', async (req: AuthRequest, res: Response) => {
  try {
    const area = await vibeService.getArea(req.params.id);
    if (!area) {
      return res.status(404).json({ error: 'Area not found' });
    }
    res.json(area);
  } catch (error) {
    console.error('Get area error:', error);
    res.status(500).json({ error: 'Failed to fetch area' });
  }
});

/**
 * GET /vibe/areas/:id/prediction
 * Get mood prediction for area
 */
router.get('/areas/:id/prediction', async (req: AuthRequest, res: Response) => {
  try {
    const prediction = await vibeService.getMoodPrediction(req.params.id);
    res.json(prediction);
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({ error: error.message || 'Failed to get prediction' });
  }
});

/**
 * GET /vibe/heatmap
 * Get crowd heatmap data
 */
router.get('/heatmap', async (req: AuthRequest, res: Response) => {
  try {
    const { lat, lng, radius } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Location required' });
    }

    const heatmap = await vibeService.getCrowdHeatmap(
      {
        latitude: parseFloat(lat as string),
        longitude: parseFloat(lng as string),
      },
      radius ? parseInt(radius as string) : 5000
    );

    res.json(heatmap);
  } catch (error) {
    console.error('Heatmap error:', error);
    res.status(500).json({ error: 'Failed to fetch heatmap' });
  }
});

export default router;
