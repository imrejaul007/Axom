import { Router, Response } from 'express';
import { eventService } from '../services/eventService.js';
import { internalAuth, AuthRequest, requireUserId } from '../middleware/auth.js';

const router = Router();

router.use(internalAuth);

/**
 * GET /organizer/events
 * Get organizer's events
 */
router.get('/events', requireUserId, async (req: AuthRequest, res: Response) => {
  try {
    const events = await eventService.getOrganizerEvents(req.userId!);
    res.json({ events });
  } catch (error) {
    console.error('Get organizer events error:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

export default router;
