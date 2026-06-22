import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { oo2iService } from '../services/OO2IService';

const router = Router();

// Validation schemas
const kioskSchema = z.object({
  kioskId: z.string().min(1),
  type: z.enum(['society', 'merchant', 'event', 'transit']),
  ownerId: z.string().min(1),
  ownerType: z.enum(['society', 'merchant', 'event']),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  address: z.string().optional(),
  areaId: z.string().min(1),
  areaName: z.string().min(1),
  display: z.object({
    screenSize: z.string(),
    orientation: z.enum(['portrait', 'landscape']),
  }).optional(),
});

const scanSchema = z.object({
  qrId: z.string().min(1),
  qrType: z.enum(['society', 'merchant', 'event', 'offer', 'product']),
  userId: z.string().optional(),
  guestId: z.string().optional(),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  areaId: z.string().min(1),
  areaName: z.string().min(1),
  source: z.enum(['app', 'camera', 'kiosk']),
  triggeredBy: z.enum(['proximity', 'manual', 'scheduled']).optional(),
});

const triggerSchema = z.object({
  type: z.enum(['proximity', 'time', 'event', 'qr_scan']),
  condition: z.object({
    areaId: z.string().optional(),
    radius: z.number().optional(),
    timeRange: z.object({
      start: z.string(),
      end: z.string(),
    }).optional(),
    eventId: z.string().optional(),
    category: z.string().optional(),
  }),
  action: z.object({
    type: z.enum(['offer', 'notification', 'deeplink', 'content']),
    payload: z.record(z.any()),
  }),
  priority: z.number().optional(),
});

const doohSchema = z.object({
  screenId: z.string().min(1),
  screenName: z.string().min(1),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  areaId: z.string().min(1),
  areaName: z.string().min(1),
  ownerId: z.string().min(1),
  screenType: z.enum(['billboard', 'kiosk', 'taxi', 'elevator', 'restaurant']),
  specs: z.object({
    width: z.number(),
    height: z.number(),
    orientation: z.string(),
  }).optional(),
});

// Health check
router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'oo2i-service' });
});

// ===== QR KIOSKS =====

// POST /api/oo2i/kiosk - Register kiosk
router.post('/kiosk', async (req: Request, res: Response) => {
  try {
    const data = kioskSchema.parse(req.body);
    const kiosk = await oo2iService.registerKiosk(data);
    res.json({ success: true, kiosk });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/oo2i/kiosk/:kioskId - Get kiosk
router.get('/kiosk/:kioskId', async (req: Request, res: Response) => {
  try {
    const kiosk = await oo2iService.getKiosk(req.params.kioskId);
    if (!kiosk) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, kiosk });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/oo2i/kiosks/nearby - Get nearby kiosks
router.get('/kiosks/nearby', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radius = parseFloat(req.query.radius as string) || 1;

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ success: false, error: 'lat and lng required' });
    }

    const kiosks = await oo2iService.getNearbyKiosks(lat, lng, radius);
    res.json({ success: true, kiosks });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== QR SCANS =====

// POST /api/oo2i/scan - Record scan
router.post('/scan', async (req: Request, res: Response) => {
  try {
    const data = scanSchema.parse(req.body);
    const scan = await oo2iService.recordScan(data);
    res.json({ success: true, scanId: scan.scanId });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/oo2i/analytics/:qrId - Get scan analytics
router.get('/analytics/:qrId', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const analytics = await oo2iService.getScanAnalytics(req.params.qrId, days);
    res.json({ success: true, analytics });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== LOCATION TRIGGERS =====

// POST /api/oo2i/trigger - Create trigger
router.post('/trigger', async (req: Request, res: Response) => {
  try {
    const data = triggerSchema.parse(req.body);
    const trigger = await oo2iService.createTrigger(data);
    res.json({ success: true, trigger });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/oo2i/triggers - Get triggers for location
router.get('/triggers', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const areaId = req.query.areaId as string;

    if (isNaN(lat) || isNaN(lng) || !areaId) {
      return res.status(400).json({ success: false, error: 'lat, lng, and areaId required' });
    }

    const result = await oo2iService.getTriggersForLocation(lat, lng, areaId);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== DOOH =====

// POST /api/oo2i/dooh/screen - Register DOOH screen
router.post('/dooh/screen', async (req: Request, res: Response) => {
  try {
    const data = doohSchema.parse(req.body);
    const screen = await oo2iService.registerDOOHScreen(data);
    res.json({ success: true, screen });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/oo2i/dooh/screens - Get nearby screens
router.get('/dooh/screens', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radius = parseFloat(req.query.radius as string) || 2;

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ success: false, error: 'lat and lng required' });
    }

    const screens = await oo2iService.getNearbyScreens(lat, lng, radius);
    res.json({ success: true, screens });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/oo2i/dooh/impression - Record impression
router.post('/dooh/impression', async (req: Request, res: Response) => {
  try {
    const { screenId } = req.body;
    const screen = await oo2iService.recordImpression(screenId);
    res.json({ success: true, impressions: screen?.stats?.impressions });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/oo2i/dooh/interaction - Record interaction
router.post('/dooh/interaction', async (req: Request, res: Response) => {
  try {
    const { screenId, userId, action } = req.body;
    const scan = await oo2iService.recordInteraction(screenId, userId, action);
    res.json({ success: true, scanId: scan.scanId });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== ANALYTICS =====

// GET /api/oo2i/analytics - Overall analytics
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const areaId = req.query.areaId as string;
    const days = parseInt(req.query.days as string) || 7;
    const analytics = await oo2iService.getAnalytics(areaId, days);
    res.json({ success: true, analytics });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export { router as oo2iRoutes };
