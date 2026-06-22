import { Router, Request, Response, NextFunction } from 'express';
import { weatherService } from '../services/weatherService.js';

const router = Router();

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => { Promise.resolve(fn(req, res, next)).catch(next); };

// Get weather
router.get('/weather', asyncHandler(async (req: Request, res: Response) => {
  const { latitude, longitude } = req.query;
  if (!latitude || !longitude) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'latitude and longitude are required' } });
  }
  const weather = await weatherService.getWeather(parseFloat(latitude as string), parseFloat(longitude as string));
  return res.json({ success: true, data: weather });
}));

// Get alerts
router.get('/alerts', asyncHandler(async (req: Request, res: Response) => {
  const { latitude, longitude, radius = '10000' } = req.query;
  if (!latitude || !longitude) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'latitude and longitude are required' } });
  }
  const alerts = await weatherService.getAlerts(parseFloat(latitude as string), parseFloat(longitude as string), parseInt(radius as string, 10));
  return res.json({ success: true, data: { alerts } });
}));

// Create alert
router.post('/alerts', asyncHandler(async (req: Request, res: Response) => {
  const { type, severity, title, message, latitude, longitude, radius, expiresInHours } = req.body;
  if (!type || !severity || !title || !message || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } });
  }
  const alert = await weatherService.createAlert({ type, severity, title, message, latitude, longitude, radius: radius || 5000, expiresInHours: expiresInHours || 2 });
  return res.status(201).json({ success: true, data: alert });
}));

// Check weather conditions
router.get('/check', asyncHandler(async (req: Request, res: Response) => {
  const { latitude, longitude } = req.query;
  if (!latitude || !longitude) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'latitude and longitude are required' } });
  }
  const alert = await weatherService.checkWeatherConditions(parseFloat(latitude as string), parseFloat(longitude as string));
  return res.json({ success: true, data: { alert } });
}));

export default router;