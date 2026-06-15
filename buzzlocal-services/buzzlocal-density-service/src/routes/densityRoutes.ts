import { Router, Request, Response, NextFunction } from 'express';
import { AreaDensity } from '../models/DensityModels';

export const router = Router();

// GET /api/density/heatmap
router.get('/heatmap', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lat, lng, radius } = req.query;
    const areas = await AreaDensity.find({}).limit(100);
    res.json({ success: true, areas });
  } catch (error) {
    next(error);
  }
});

// GET /api/density/area/:id
router.get('/area/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const area = await AreaDensity.findOne({ areaId: req.params.id });
    if (!area) return res.status(404).json({ error: 'Area not found' });
    res.json({ success: true, area });
  } catch (error) {
    next(error);
  }
});

// GET /api/density/prediction/:id
router.get('/prediction/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const area = await AreaDensity.findOne({ areaId: req.params.id });
    if (!area) return res.status(404).json({ error: 'Area not found' });
    // Simple prediction based on trend
    const predictedLevel = area.trend === 'increasing'
      ? Math.min(5, area.crowdLevel + 1)
      : area.trend === 'decreasing'
        ? Math.max(1, area.crowdLevel - 1)
        : area.crowdLevel;
    res.json({ success: true, prediction: { current: area.crowdLevel, predicted: predictedLevel, trend: area.trend } });
  } catch (error) {
    next(error);
  }
});

// POST /api/density/checkin
router.post('/checkin', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { areaId, location } = req.body;
    let area = await AreaDensity.findOne({ areaId });
    if (!area) {
      area = new AreaDensity({ areaId, name: areaId, location, factors: { checkIns: 1 } });
    } else {
      area.factors.checkIns += 1;
      area.score = Math.min(100, area.score + 2);
      area.crowdLevel = Math.min(5, Math.ceil(area.score / 20)) as 1 | 2 | 3 | 4 | 5;
    }
    area.lastUpdated = new Date();
    await area.save();
    res.json({ success: true, crowdLevel: area.crowdLevel, score: area.score });
  } catch (error) {
    next(error);
  }
});

// GET /api/density/peak/:area
router.get('/peak/:area', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Return mock peak hours data
    res.json({
      success: true,
      peakHours: [
        { hour: 12, level: 3 },
        { hour: 18, level: 5 },
        { hour: 21, level: 4 }
      ]
    });
  } catch (error) {
    next(error);
  }
});
