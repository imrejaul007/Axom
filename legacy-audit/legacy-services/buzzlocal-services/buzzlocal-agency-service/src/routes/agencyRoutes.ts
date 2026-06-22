import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AgencyAlert, AgencySource, UserSubscription } from '../models/AgencyModels';

const router = Router();

// Validation schemas
const subscriptionSchema = z.object({
  sources: z.array(z.enum(['bbmp', 'metro', 'traffic', 'weather', 'bescom', 'bwssb', 'fire', 'police'])),
  areas: z.array(z.string()),
  notifyOn: z.object({
    low: z.boolean().optional(),
    medium: z.boolean().optional(),
    high: z.boolean().optional(),
    critical: z.boolean().optional()
  }).optional()
});

// GET /api/alerts/public - Get agency alerts
router.get('/public', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { source, area, priority, status, limit = 20, offset = 0 } = req.query;

    const query: Record<string, unknown> = {};
    if (source) query.source = source;
    if (area) query.affectedAreas = area;
    if (priority) query.priority = priority;
    if (status === 'active') query.isActive = true;

    const alerts = await AgencyAlert.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .skip(Number(offset))
      .limit(Number(limit));

    const total = await AgencyAlert.countDocuments(query);

    res.json({
      success: true,
      alerts,
      total,
      offset,
      limit
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/alerts/sources - List alert sources
router.get('/sources', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sources = await AgencySource.find({ isActive: true })
      .sort({ priority: -1 });

    res.json({
      success: true,
      sources: sources.map(s => ({
        name: s.name,
        type: s.type,
        description: getSourceDescription(s.type),
        icon: getSourceIcon(s.type)
      }))
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/alerts/metro - Get metro status
router.get('/metro', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const alerts = await AgencyAlert.find({
      source: 'metro',
      isActive: true
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      status: alerts.length === 0 ? 'normal' : 'delays',
      alerts
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/alerts/weather - Get weather warnings
router.get('/weather', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const alerts = await AgencyAlert.find({
      source: 'weather',
      isActive: true
    }).sort({ priority: -1, createdAt: -1 });

    res.json({
      success: true,
      alerts
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/alerts/traffic - Get traffic alerts
router.get('/traffic', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const alerts = await AgencyAlert.find({
      source: 'traffic',
      isActive: true
    }).sort({ priority: -1, createdAt: -1 });

    res.json({
      success: true,
      alerts
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/alerts/power - Get BESCOM updates
router.get('/power', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const alerts = await AgencyAlert.find({
      source: 'bescom',
      isActive: true
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      alerts
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/alerts/subscribe - Subscribe to alerts
router.post('/subscribe', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = subscriptionSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const { sources, areas, notifyOn } = validation.data;

    const subscription = await UserSubscription.findOneAndUpdate(
      { userId },
      {
        sources: sources || [],
        areas: areas || [],
        notifyOn: notifyOn || { low: true, medium: true, high: true, critical: true }
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      subscription
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/alerts/subscription - Get user subscription
router.get('/subscription', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    let subscription = await UserSubscription.findOne({ userId });

    if (!subscription) {
      subscription = new UserSubscription({
        userId,
        sources: [],
        areas: [],
        notifyOn: { low: true, medium: true, high: true, critical: true }
      });
      await subscription.save();
    }

    res.json({
      success: true,
      subscription
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/alerts/nearby - Get alerts near location
router.get('/nearby', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lat, lng, radius = 5000 } = req.query;

    // Get all active alerts
    const alerts = await AgencyAlert.find({
      isActive: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [Number(lng), Number(lat)]
          },
          $maxDistance: Number(radius)
        }
      }
    }).limit(20);

    res.json({
      success: true,
      alerts
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/alerts/:id - Get alert detail
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const alert = await AgencyAlert.findById(id);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    // Increment user alerts
    alert.userAlerts += 1;
    await alert.save();

    res.json({
      success: true,
      alert
    });
  } catch (error) {
    next(error);
  }
});

// Helper functions
function getSourceDescription(type: string): string {
  const descriptions: Record<string, string> = {
    bbmp: 'BBMP (Bruhat Bengaluru Mahanagara Palike) - Roads, sanitation, water',
    metro: 'BMRC Metro - Train timings, delays, station updates',
    traffic: 'Traffic Police - Accidents, diversions, road closures',
    weather: 'IMD - Weather warnings, rainfall, temperature',
    bescom: 'BESCOM - Power outages, load shedding',
    bwssb: 'BWSSB - Water supply, sewage',
    fire: 'Fire Department - Fire alerts, emergency',
    police: 'Police - Law and order, security alerts'
  };
  return descriptions[type] || 'Unknown source';
}

function getSourceIcon(type: string): string {
  const icons: Record<string, string> = '🏛️';
  const iconMap: Record<string, string> = {
    bbmp: '🏛️',
    metro: '🚇',
    traffic: '🚦',
    weather: '🌧️',
    bescom: '⚡',
    bwssb: '💧',
    fire: '🔥',
    police: '🚔'
  };
  return iconMap[type] || icons;
}

export { router as agencyRoutes };
