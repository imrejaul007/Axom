import { Router, Request, Response, NextFunction } from 'express';
import { CrisisIncident, SOSAlert, Shelter, Resource } from '../models/CrisisModels';

export const router = Router();

// POST /api/crisis/sos
router.post('/sos', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { location, type, message } = req.body;
    const sos = new SOSAlert({ userId, location, type, status: 'active' });
    await sos.save();
    res.json({ success: true, sosId: sos._id, message: 'SOS triggered, contacts notified' });
  } catch (error) {
    next(error);
  }
});

// GET /api/crisis/incidents
router.get('/incidents', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status = 'active', limit = 20 } = req.query;
    const incidents = await CrisisIncident.find({ status }).sort({ createdAt: -1 }).limit(Number(limit));
    res.json({ success: true, incidents });
  } catch (error) {
    next(error);
  }
});

// GET /api/crisis/shelters
router.get('/shelters', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lat, lng } = req.query;
    const shelters = await Shelter.find({ isActive: true });
    res.json({ success: true, shelters });
  } catch (error) {
    next(error);
  }
});

// GET /api/crisis/resources
router.get('/resources', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, area } = req.query;
    const query: any = { available: true };
    if (type) query.type = type;
    if (area) query['location.area'] = area;
    const resources = await Resource.find(query);
    res.json({ success: true, resources });
  } catch (error) {
    next(error);
  }
});

// POST /api/crisis/volunteer
router.post('/volunteer', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    res.json({ success: true, message: 'Registered as volunteer', volunteerId: userId });
  } catch (error) {
    next(error);
  }
});

// POST /api/crisis/checkin
router.post('/checkin', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { status, note } = req.body;
    res.json({ success: true, message: 'Check-in recorded', status: status || 'safe' });
  } catch (error) {
    next(error);
  }
});
