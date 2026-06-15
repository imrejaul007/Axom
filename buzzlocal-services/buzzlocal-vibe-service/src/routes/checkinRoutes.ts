import { Router, Response } from 'express';
import { vibeService } from '../services/vibeService.js';
import { analyticsService } from '../services/analyticsService.js';
import { internalAuth, AuthRequest, requireUserId } from '../middleware/auth.js';

const router = Router();

router.use(internalAuth);

/**
 * POST /checkin
 * Check in to a location
 */
router.post('/', requireUserId, async (req: AuthRequest, res: Response) => {
  try {
    const { latitude, longitude, placeId, placeName, source } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Location required' });
    }

    const checkIn = await vibeService.checkIn({
      userId: req.userId!,
      location: { latitude, longitude },
      placeId,
      placeName,
      source: source || 'manual',
    });

    analyticsService.track('check_in', {
      userId: req.userId,
      placeId,
      source,
    });

    res.status(201).json({
      checkInId: checkIn._id.toString(),
      coinReward: (checkIn as unknown).coinReward,
      message: 'Checked in successfully!',
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ error: 'Failed to check in' });
  }
});

/**
 * POST /checkin/out
 * Check out from current location
 */
router.post('/out', requireUserId, async (req: AuthRequest, res: Response) => {
  try {
    const result = await vibeService.checkOut(req.userId!);

    analyticsService.track('check_out', {
      userId: req.userId,
      duration: result.duration,
    });

    res.json(result);
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ error: error.message || 'Failed to check out' });
  }
});

/**
 * GET /checkin/current
 * Get current check-in
 */
router.get('/current', requireUserId, async (req: AuthRequest, res: Response) => {
  try {
    const checkIn = await vibeService.getCurrentCheckIn(req.userId!);
    res.json({ checkIn });
  } catch (error) {
    console.error('Current check-in error:', error);
    res.status(500).json({ error: 'Failed to fetch current check-in' });
  }
});

/**
 * GET /checkin/history
 * Get check-in history
 */
router.get('/history', requireUserId, async (req: AuthRequest, res: Response) => {
  try {
    const { limit } = req.query;
    const history = await vibeService.getCheckInHistory(
      req.userId!,
      limit ? parseInt(limit as string) : 20
    );
    res.json({ history });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

export default router;
