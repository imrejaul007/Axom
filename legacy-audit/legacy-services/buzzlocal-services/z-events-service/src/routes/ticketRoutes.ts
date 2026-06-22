import { Router, Response } from 'express';
import { eventService } from '../services/eventService.js';
import { internalAuth, AuthRequest, requireUserId } from '../middleware/auth.js';

const router = Router();

router.use(internalAuth);

/**
 * POST /tickets
 * Purchase ticket
 */
router.post('/', requireUserId, async (req: AuthRequest, res: Response) => {
  try {
    const { eventId, quantity } = req.body;

    if (!eventId) {
      return res.status(400).json({ error: 'Event ID required' });
    }

    const result = await eventService.purchaseTicket(
      eventId,
      req.userId!,
      quantity || 1
    );

    res.status(201).json(result);
  } catch (error) {
    console.error('Purchase ticket error:', error);
    res.status(400).json({ error: error.message || 'Failed to purchase ticket' });
  }
});

/**
 * POST /tickets/checkin
 * Check in with ticket code
 */
router.post('/checkin', async (req: AuthRequest, res: Response) => {
  try {
    const { ticketCode } = req.body;

    if (!ticketCode) {
      return res.status(400).json({ error: 'Ticket code required' });
    }

    const result = await eventService.checkIn(ticketCode, req.userId);
    res.json(result);
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(400).json({ error: error.message || 'Check-in failed' });
  }
});

/**
 * GET /tickets/user
 * Get user's tickets
 */
router.get('/user', requireUserId, async (req: AuthRequest, res: Response) => {
  try {
    const tickets = await eventService.getUserTickets(req.userId!);
    res.json({ tickets });
  } catch (error) {
    console.error('Get user tickets error:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

export default router;
