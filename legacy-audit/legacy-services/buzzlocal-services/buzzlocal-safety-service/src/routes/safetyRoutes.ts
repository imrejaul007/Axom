import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Server as SocketIOServer } from 'socket.io';
import {
  SafetyAlert,
  TrustedCircle,
  SafetyCheckIn,
  SafetyProfile,
  AreaSafety,
  EmergencyContact,
  CREDIBILITY_WEIGHTS,
  AlertType,
  AlertSeverity
} from '../models/SafetyModels';
import { AlertProcessor } from '../services/AlertProcessor';
import { CredibilityEngine } from '../services/CredibilityEngine';
import { NotificationService } from '../services/NotificationService';

const router = Router();

// Validation schemas
const alertSchema = z.object({
  type: z.enum(['suspicious', 'road', 'crime', 'hazard', 'traffic', 'infrastructure', 'women_safety', 'emergency']),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  title: z.string().min(5).max(100),
  description: z.string().min(10).max(500),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string(),
    area: z.string()
  }),
  evidence: z.array(z.string()).optional(),
  images: z.array(z.string()).optional()
});

const reportSchema = z.object({
  vote: z.enum(['confirm', 'dispute']),
  comment: z.string().optional()
});

const circleMemberSchema = z.object({
  userId: z.string(),
  name: z.string(),
  phone: z.string(),
  relationship: z.string().optional(),
  notifyOn: z.enum(['always', 'emergency_only']).optional()
});

const checkInSchema = z.object({
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    area: z.string()
  }),
  status: z.enum(['safe', 'concerned', 'emergency']).optional(),
  note: z.string().optional(),
  expectedDuration: z.number().optional()
});

const sosSchema = z.object({
  location: z.object({
    lat: z.number(),
    lng: z.number()
  }),
  type: z.enum(['panic', 'medical', 'fire', 'other']).optional(),
  message: z.string().optional()
});

// Helper: Get user info from header
function getUserId(req: Request): string {
  return req.headers['x-user-id'] as string || 'anonymous';
}

// GET /api/safety/heatmap - Get safety heatmap data
router.get('/heatmap', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lat, lng, radius = 5000 } = req.query;

    // Get areas with safety data
    const areas = await AreaSafety.find({}).limit(100);

    // Get active alerts in area
    const alerts = await SafetyAlert.find({
      status: { $in: ['active', 'verified'] },
      expiresAt: { $gt: new Date() }
    }).limit(50);

    res.json({
      success: true,
      areas: areas.map(a => ({
        areaId: a.areaId,
        name: a.name,
        location: a.location,
        safetyLevel: a.safetyLevel,
        score: a.score,
        activeAlerts: a.activeAlerts
      })),
      alerts: alerts.map(a => ({
        id: a._id,
        type: a.type,
        severity: a.severity,
        location: a.location,
        title: a.title,
        credibility: a.credibility,
        status: a.status
      }))
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/safety/alerts - List alerts
router.get('/alerts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { area, type, severity, status, limit = 20, offset = 0 } = req.query;

    const query: Record<string, unknown> = {};
    if (area) query['location.area'] = area;
    if (type) query.type = type;
    if (severity) query.severity = severity;
    if (status) query.status = status;

    const alerts = await SafetyAlert.find(query)
      .sort({ createdAt: -1 })
      .skip(Number(offset))
      .limit(Number(limit));

    const total = await SafetyAlert.countDocuments(query);

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

// POST /api/safety/alert - Submit alert
router.post('/alert', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = alertSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const userId = getUserId(req);
    const { type, severity, title, description, location, evidence, images } = validation.data;

    // Create alert
    const alert = new SafetyAlert({
      type,
      severity: severity || 'medium',
      title,
      description,
      location,
      evidence,
      images,
      author: {
        userId,
        trustLevel: req.headers['x-trust-level'] as string || 'new',
        trustScore: Number(req.headers['x-trust-score']) || 0,
        area: location.area
      },
      status: 'active'
    });

    await alert.save();

    // Calculate credibility
    const io: SocketIOServer = req.app.get('io');
    const alertProcessor: AlertProcessor = req.app.get('alertProcessor');
    const credibility = await alertProcessor.calculateAndUpdateCredibility(alert);

    // Emit to area subscribers
    io.to(`area:${location.area}`).emit('new:alert', {
      id: alert._id,
      type,
      severity: severity || 'medium',
      title,
      location,
      credibility
    });

    // Send push notifications to nearby users
    const notificationService = new NotificationService();
    await notificationService.sendAlertNotification(alert);

    res.json({
      success: true,
      alertId: alert._id,
      credibility,
      message: 'Alert submitted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/safety/alerts/:id - Get alert detail
router.get('/alerts/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const alert = await SafetyAlert.findById(id);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json({
      success: true,
      alert
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/safety/verify - Verify/dispute alert
router.post('/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { alertId, vote, comment } = req.body;
    const userId = getUserId(req);

    const alert = await SafetyAlert.findById(alertId);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    // Check if already voted
    const existingReport = alert.reports.find(r => r.userId === userId);
    if (existingReport) {
      return res.status(409).json({ error: 'Already voted' });
    }

    // Add report
    alert.reports.push({
      userId,
      vote,
      comment,
      trustLevel: req.headers['x-trust-level'] as string || 'new',
      timestamp: new Date()
    });

    if (vote === 'confirm') {
      alert.confirmedBy.push(userId);
    } else {
      alert.disputedBy.push(userId);
    }

    // Recalculate credibility
    const io: SocketIOServer = req.app.get('io');
    const alertProcessor: AlertProcessor = req.app.get('alertProcessor');
    const newCredibility = await alertProcessor.calculateAndUpdateCredibility(alert);

    await alert.save();

    // Emit update
    io.to(`area:${alert.location.area}`).emit('update:alert', {
      alertId: alert._id,
      credibility: newCredibility,
      confirmations: alert.confirmedBy.length,
      disputes: alert.disputedBy.length
    });

    res.json({
      success: true,
      credibility: newCredibility,
      confirmations: alert.confirmedBy.length,
      disputes: alert.disputedBy.length
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/safety/sos - Trigger SOS
router.post('/sos', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { location, type, message } = req.body;
    const userId = getUserId(req);

    // Get trusted circle
    const circle = await TrustedCircle.findOne({ userId });
    const profile = await SafetyProfile.findOne({ userId });

    // Create emergency alert
    const alert = new SafetyAlert({
      type: 'emergency',
      severity: 'critical',
      title: `SOS Alert - ${type || 'Emergency'}`,
      description: message || 'Emergency SOS triggered',
      location,
      author: {
        userId,
        trustLevel: profile?.womenModeEnabled ? 'guardian' : 'trusted',
        trustScore: 100,
        area: location.area
      },
      status: 'active',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    });

    await alert.save();

    // Notify trusted circle
    const notificationService = new NotificationService();
    if (circle) {
      for (const member of circle.members) {
        await notificationService.sendSOSNotification(member.userId, {
          alertId: alert._id,
          location,
          triggeredBy: userId
        });
      }
    }

    // Emit to nearby users (opt-in)
    const io: SocketIOServer = req.app.get('io');
    io.to(`area:${location.area}`).emit('sos:alert', {
      alertId: alert._id,
      location
    });

    res.json({
      success: true,
      alertId: alert._id,
      notifiedContacts: circle?.members.length || 0,
      message: 'SOS triggered, contacts notified'
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/safety/safe-route - Get safe route
router.get('/safe-route', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fromLat, fromLng, toLat, toLng } = req.query;

    // Get safety scores along the route
    const areas = await AreaSafety.find({}).limit(50);

    // Simple route safety calculation
    // In production, use proper routing API
    const safeAreas = areas.filter(a => a.safetyLevel === 'safe' || a.safetyLevel === 'moderate');

    // Find nearest safe areas to start and end
    const nearestSafeFrom = safeAreas[0];
    const nearestSafeTo = safeAreas[0];

    res.json({
      success: true,
      route: {
        waypoints: [
          { lat: Number(fromLat), lng: Number(fromLng) },
          nearestSafeFrom?.location || { lat: Number(fromLat), lng: Number(fromLng) },
          nearestSafeTo?.location || { lat: Number(toLat), lng: Number(toLng) },
          { lat: Number(toLat), lng: Number(toLng) }
        ],
        safetyScore: 85,
        estimatedTime: '15 mins',
        safeStops: ['Police Station - 500m', 'Hospital - 1km', 'Busy Market - 800m']
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/safety/circle - Get trusted circle
router.get('/circle', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);

    let circle = await TrustedCircle.findOne({ userId });

    if (!circle) {
      circle = new TrustedCircle({
        userId,
        members: []
      });
      await circle.save();
    }

    res.json({
      success: true,
      circle: circle.members
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/safety/circle - Add to trusted circle
router.post('/circle', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = circleMemberSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const userId = getUserId(req);
    const memberData = validation.data;

    let circle = await TrustedCircle.findOne({ userId });

    if (!circle) {
      circle = new TrustedCircle({
        userId,
        members: []
      });
    }

    // Check if member already exists
    const exists = circle.members.some(m => m.userId === memberData.userId);
    if (exists) {
      return res.status(409).json({ error: 'Member already in circle' });
    }

    circle.members.push({
      userId: memberData.userId,
      name: memberData.name,
      phone: memberData.phone,
      relationship: memberData.relationship || 'Friend',
      notifyOn: memberData.notifyOn || 'emergency_only',
      addedAt: new Date()
    });

    await circle.save();

    res.json({
      success: true,
      message: 'Member added to circle'
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/safety/circle/:memberId - Remove from circle
router.delete('/circle/:memberId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { memberId } = req.params;
    const userId = getUserId(req);

    await TrustedCircle.findOneAndUpdate(
      { userId },
      { $pull: { members: { userId: memberId } } }
    );

    res.json({
      success: true,
      message: 'Member removed from circle'
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/safety/profile - Get safety profile
router.get('/profile', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);

    let profile = await SafetyProfile.findOne({ userId });

    if (!profile) {
      profile = new SafetyProfile({ userId });
      await profile.save();
    }

    res.json({
      success: true,
      profile
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/safety/profile - Update safety profile
router.put('/profile', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getUserId(req);
    const updates = req.body;

    const profile = await SafetyProfile.findOneAndUpdate(
      { userId },
      { $set: updates },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      profile
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/safety/checkin - Safety check-in
router.post('/checkin', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = checkInSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const userId = getUserId(req);
    const { location, status, note, expectedDuration } = validation.data;

    const checkIn = new SafetyCheckIn({
      userId,
      location,
      status: status || 'safe',
      note,
      expectedDuration,
      alertedContacts: []
    });

    // Set auto-alert time if expected duration provided
    if (expectedDuration) {
      checkIn.autoAlertAt = new Date(Date.now() + expectedDuration * 60 * 1000);
    }

    await checkIn.save();

    res.json({
      success: true,
      checkInId: checkIn._id,
      message: 'Check-in recorded'
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/safety/emergency-contacts - Get nearby emergency contacts
router.get('/emergency-contacts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lat, lng } = req.query;

    // Static emergency contacts for demo
    // In production, query from database based on location
    const contacts = [
      {
        type: 'police',
        name: 'Police Control Room',
        phone: '100',
        distance: '0.5 km'
      },
      {
        type: 'women_helpline',
        name: 'Women Helpline',
        phone: '181',
        distance: '1 km'
      },
      {
        type: 'ambulance',
        name: 'Ambulance',
        phone: '108',
        distance: '1.5 km'
      }
    ];

    res.json({
      success: true,
      contacts
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/safety/area/:areaId - Get area safety
router.get('/area/:areaId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { areaId } = req.params;

    let areaSafety = await AreaSafety.findOne({ areaId });

    if (!areaSafety) {
      // Create default
      areaSafety = new AreaSafety({
        areaId,
        name: areaId,
        location: { lat: 0, lng: 0 },
        safetyLevel: 'moderate',
        score: 50
      });
      await areaSafety.save();
    }

    res.json({
      success: true,
      area: areaSafety
    });
  } catch (error) {
    next(error);
  }
});

export { router as safetyRoutes };
