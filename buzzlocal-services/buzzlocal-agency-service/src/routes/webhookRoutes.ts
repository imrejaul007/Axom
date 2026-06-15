import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { AgencyAlert, AgencySource } from '../models/AgencyModels';
import { NotificationService } from '../services/NotificationService';

const router = Router();
const notificationService = new NotificationService();

// Verify webhook signature
function verifyWebhook(req: Request, secret: string): boolean {
  const signature = req.headers['x-webhook-signature'] as string;
  if (!signature) return false;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  return signature === expectedSignature;
}

// POST /api/alerts/webhook/bbmp - BBMP webhook
router.post('/bbmp', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const secret = process.env.BBMP_WEBHOOK_SECRET || '';
    if (!verifyWebhook(req, secret)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { sourceId, title, description, type, location, affectedAreas, priority } = req.body;

    const alert = await AgencyAlert.findOneAndUpdate(
      { source: 'bbmp', sourceId },
      {
        source: 'bbmp',
        sourceId,
        title,
        description,
        type,
        priority: priority || 'medium',
        location,
        affectedAreas: affectedAreas || [],
        isActive: true,
        verified: true
      },
      { new: true, upsert: true }
    );

    // Send notifications
    await notificationService.sendAgencyAlert(alert);

    res.json({ success: true, alertId: alert._id });
  } catch (error) {
    next(error);
  }
});

// POST /api/alerts/webhook/metro - Metro webhook
router.post('/metro', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const secret = process.env.METRO_WEBHOOK_SECRET || '';
    if (!verifyWebhook(req, secret)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { sourceId, title, description, station, line, priority } = req.body;

    const alert = await AgencyAlert.findOneAndUpdate(
      { source: 'metro', sourceId },
      {
        source: 'metro',
        sourceId,
        title: title || `Metro Update - ${line}`,
        description,
        type: 'delay',
        priority: priority || 'medium',
        location: { address: station },
        affectedAreas: [station],
        isActive: true,
        verified: true
      },
      { new: true, upsert: true }
    );

    await notificationService.sendAgencyAlert(alert);

    res.json({ success: true, alertId: alert._id });
  } catch (error) {
    next(error);
  }
});

// POST /api/alerts/webhook/traffic - Traffic webhook
router.post('/traffic', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const secret = process.env.TRAFFIC_WEBHOOK_SECRET || '';
    if (!verifyWebhook(req, secret)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { sourceId, title, description, location, type, priority } = req.body;

    const alert = await AgencyAlert.findOneAndUpdate(
      { source: 'traffic', sourceId },
      {
        source: 'traffic',
        sourceId,
        title: title || 'Traffic Update',
        description,
        type: type || 'accident',
        priority: priority || 'high',
        location,
        affectedAreas: [location?.area],
        isActive: true,
        verified: true
      },
      { new: true, upsert: true }
    );

    await notificationService.sendAgencyAlert(alert);

    res.json({ success: true, alertId: alert._id });
  } catch (error) {
    next(error);
  }
});

// POST /api/alerts/webhook/weather - Weather webhook
router.post('/weather', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const secret = process.env.WEATHER_WEBHOOK_SECRET || '';
    if (!verifyWebhook(req, secret)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { sourceId, title, description, severity, areas, endTime } = req.body;

    const alert = await AgencyAlert.findOneAndUpdate(
      { source: 'weather', sourceId },
      {
        source: 'weather',
        sourceId,
        title,
        description,
        type: 'weather_warning',
        priority: severity || 'medium',
        affectedAreas: areas || [],
        endTime: endTime ? new Date(endTime) : undefined,
        isActive: true,
        verified: true
      },
      { new: true, upsert: true }
    );

    await notificationService.sendAgencyAlert(alert);

    res.json({ success: true, alertId: alert._id });
  } catch (error) {
    next(error);
  }
});

// POST /api/alerts/webhook/bescom - BESCOM webhook
router.post('/bescom', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sourceId, title, description, location, areas, priority } = req.body;

    const alert = await AgencyAlert.findOneAndUpdate(
      { source: 'bescom', sourceId },
      {
        source: 'bescom',
        sourceId,
        title: title || 'Power Update',
        description,
        type: 'power_outage',
        priority: priority || 'medium',
        location,
        affectedAreas: areas || [],
        isActive: true,
        verified: true
      },
      { new: true, upsert: true }
    );

    await notificationService.sendAgencyAlert(alert);

    res.json({ success: true, alertId: alert._id });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/alerts/webhook/:source/:sourceId - Clear alert
router.delete('/:source/:sourceId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { source, sourceId } = req.params;

    const alert = await AgencyAlert.findOneAndUpdate(
      { source, sourceId },
      { isActive: false, endTime: new Date() },
      { new: true }
    );

    res.json({ success: true, alert });
  } catch (error) {
    next(error);
  }
});

export { router as webhookRoutes };
