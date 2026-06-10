import { Router, Request, Response, NextFunction } from 'express';
import { vibeService } from '../services/vibeService.js';
import { logger } from '../utils/logger.js';

const router = Router();

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => { Promise.resolve(fn(req, res, next)).catch(next); };

// Create vibe
router.post('/vibes', asyncHandler(async (req: Request, res: Response) => {
  const { name, type, latitude, longitude, address } = req.body;
  if (!name || !type || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'name, type, latitude, and longitude are required' } });
  }
  const vibe = await vibeService.createVibe({ name, type, latitude, longitude, address });
  return res.status(201).json({ success: true, data: vibe });
}));

// Get vibe
router.get('/vibes/:id', asyncHandler(async (req: Request, res: Response) => {
  const vibe = await vibeService.getVibe(req.params.id);
  if (!vibe) { return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Vibe not found' } }); }
  return res.json({ success: true, data: vibe });
}));

// Get nearby vibes
router.get('/vibes/nearby', asyncHandler(async (req: Request, res: Response) => {
  const { latitude, longitude, radius = '1000', type } = req.query;
  if (!latitude || !longitude) { return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'latitude and longitude are required' } }); }
  const vibes = await vibeService.getNearbyVibes(parseFloat(latitude as string), parseFloat(longitude as string), parseInt(radius as string, 10), type as string);
  return res.json({ success: true, data: { vibes } });
}));

// Get trending vibes
router.get('/vibes/trending/list', asyncHandler(async (req: Request, res: Response) => {
  const { limit = '10' } = req.query;
  const vibes = await vibeService.getTrendingVibes(parseInt(limit as string, 10));
  return res.json({ success: true, data: { vibes } });
}));

// Check in
router.post('/checkins', asyncHandler(async (req: Request, res: Response) => {
  const { vibeId, userId, note, photoUrl } = req.body;
  if (!vibeId || !userId) { return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'vibeId and userId are required' } }); }
  const checkIn = await vibeService.checkIn({ vibeId, userId, note, photoUrl });
  return res.status(201).json({ success: true, data: checkIn });
}));

// Get vibe check-ins
router.get('/vibes/:id/checkins', asyncHandler(async (req: Request, res: Response) => {
  const { limit = '50', offset = '0' } = req.query;
  const result = await vibeService.getCheckIns(req.params.id, parseInt(limit as string, 10), parseInt(offset as string, 10));
  return res.json({ success: true, data: { items: result.checkIns, total: result.total } });
}));

// Get user check-ins
router.get('/users/:userId/checkins', asyncHandler(async (req: Request, res: Response) => {
  const { limit = '20', offset = '0' } = req.query;
  const result = await vibeService.getUserCheckIns(req.params.userId, parseInt(limit as string, 10), parseInt(offset as string, 10));
  return res.json({ success: true, data: { items: result.checkIns, total: result.total } });
}));

// Get heatmap
router.get('/heatmap', asyncHandler(async (req: Request, res: Response) => {
  const { latitude, longitude, radius = '5000' } = req.query;
  if (!latitude || !longitude) { return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'latitude and longitude are required' } }); }
  const heatmap = await vibeService.generateHeatmap(parseFloat(latitude as string), parseFloat(longitude as string), parseInt(radius as string, 10));
  return res.json({ success: true, data: { heatmap } });
}));

export default router;