import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { movementService } from '../services/MovementService';
import { MovementEvent } from '../models/MovementModels';

const router = Router();

// Validation schemas
const movementSchema = z.object({
  userId: z.string().min(1),
  origin: z.object({
    areaId: z.string().min(1),
    areaName: z.string().min(1),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  destination: z.object({
    areaId: z.string().min(1),
    areaName: z.string().min(1),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }).optional(),
  type: z.enum(['checkin', 'checkout', 'transit', 'commute']),
  context: z.object({
    mode: z.enum(['walk', 'bike', 'auto', 'cab', 'bus', 'metro']).optional(),
    purpose: z.enum(['work', 'food', 'shopping', 'entertainment', 'social', 'transit']).optional(),
    duration: z.number().optional(),
  }).optional(),
});

// Health check
router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'movement-graph' });
});

// ===== MOVEMENT EVENTS =====

// POST /api/movement/event - Record movement
router.post('/event', async (req: Request, res: Response) => {
  try {
    const data = movementSchema.parse(req.body);
    const event = await movementService.recordMovement(data);

    res.json({
      success: true,
      eventId: event._id,
      timestamp: event.timestamp,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/movement/checkin - Quick check-in
router.post('/checkin', async (req: Request, res: Response) => {
  try {
    const { userId, areaId, areaName, lat, lng, purpose } = req.body;

    const event = await movementService.recordMovement({
      userId,
      origin: { areaId, areaName, lat, lng },
      type: 'checkin',
      context: { purpose },
    });

    res.json({ success: true, eventId: event._id });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/movement/checkout - Quick check-out
router.post('/checkout', async (req: Request, res: Response) => {
  try {
    const { userId, areaId, areaName, lat, lng } = req.body;

    const event = await movementService.recordMovement({
      userId,
      origin: { areaId, areaName, lat, lng },
      type: 'checkout',
    });

    res.json({ success: true, eventId: event._id });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/movement/transit - Record transit between areas
router.post('/transit', async (req: Request, res: Response) => {
  try {
    const { userId, from, to, mode, duration } = req.body;

    const event = await movementService.recordMovement({
      userId,
      origin: from,
      destination: to,
      type: 'transit',
      context: { mode, duration },
    });

    res.json({ success: true, eventId: event._id });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== PATTERNS =====

// GET /api/movement/commute/:userId - Get user's commute pattern
router.get('/commute/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const pattern = await movementService.detectCommutePattern(userId);

    res.json({ success: true, pattern });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/movement/trends/:areaId - Get area movement trends
router.get('/trends/:areaId', async (req: Request, res: Response) => {
  try {
    const { areaId } = req.params;
    const days = parseInt(req.query.days as string) || 7;
    const trends = await movementService.getAreaTrends(areaId, days);

    res.json({ success: true, trends });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== FLOWS =====

// GET /api/movement/flow/:fromAreaId/:toAreaId - Get flow between areas
router.get('/flow/:fromAreaId/:toAreaId', async (req: Request, res: Response) => {
  try {
    const { fromAreaId, toAreaId } = req.params;
    const date = req.query.date ? new Date(req.query.date as string) : undefined;
    const flow = await movementService.getAreaToAreaFlow(fromAreaId, toAreaId, date);

    res.json({ success: true, flow });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/movement/corridor/:areaA/:areaB - Get movement corridor
router.get('/corridor/:areaA/:areaB', async (req: Request, res: Response) => {
  try {
    const { areaA, areaB } = req.params;
    const corridor = await movementService.getMovementCorridor(areaA, areaB);

    res.json({ success: true, corridor });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== HOTSPOTS =====

// GET /api/movement/hotspots - Get nearby hotspots
router.get('/hotspots', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radius = parseFloat(req.query.radius as string) || 5;
    const limit = parseInt(req.query.limit as string) || 10;

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ success: false, error: 'lat and lng required' });
    }

    const hotspots = await movementService.getNearbyHotspots(lat, lng, radius, limit);
    res.json({ success: true, hotspots });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== PREDICTIONS =====

// GET /api/movement/predict/:areaId - Predict arrivals
router.get('/predict/:areaId', async (req: Request, res: Response) => {
  try {
    const { areaId } = req.params;
    const targetHour = parseInt(req.query.hour as string) || new Date().getHours();

    const prediction = await movementService.predictArrivals(areaId, targetHour);
    res.json({ success: true, prediction });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== HISTORY =====

// GET /api/movement/history/:userId - Get user's movement history
router.get('/history/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const events = await MovementEvent.find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit);

    res.json({ success: true, events });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/movement/area/:areaId - Get all events in an area
router.get('/area/:areaId', async (req: Request, res: Response) => {
  try {
    const { areaId } = req.params;
    const hours = parseInt(req.query.hours as string) || 24;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const events = await MovementEvent.find({
      'origin.areaId': areaId,
      timestamp: { $gte: since },
    }).sort({ timestamp: -1 }).limit(100);

    res.json({ success: true, events });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export { router as movementRoutes };
