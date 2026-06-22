import { Router, Response } from 'express';
import { eventService } from '../services/eventService.js';
import { internalAuth, AuthRequest, requireUserId } from '../middleware/auth.js';

const router = Router();

router.use(internalAuth);

/**
 * GET /events
 * List events with filters
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { category, lat, lng, radius, startDate, endDate, page, limit, status } = req.query;

    const result = await eventService.getEvents({
      category: category as unknown,
      latitude: lat ? parseFloat(lat as string) : undefined,
      longitude: lng ? parseFloat(lng as string) : undefined,
      radius: radius ? parseInt(radius as string) : undefined,
      startDate: startDate as string,
      endDate: endDate as string,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
      status: status as string,
    });

    res.json(result);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch events' });
  }
});

/**
 * GET /events/trending
 * Get trending events
 */
router.get('/trending', async (req: AuthRequest, res: Response) => {
  try {
    const { limit } = req.query;
    const events = await eventService.getTrendingEvents(
      limit ? parseInt(limit as string) : 10
    );
    res.json({ events });
  } catch (error) {
    console.error('Trending events error:', error);
    res.status(500).json({ error: 'Failed to fetch trending events' });
  }
});

/**
 * GET /events/nearby
 * Get nearby events
 */
router.get('/nearby', async (req: AuthRequest, res: Response) => {
  try {
    const { lat, lng, radius, limit } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Location required' });
    }

    const events = await eventService.getNearbyEvents(
      parseFloat(lat as string),
      parseFloat(lng as string),
      radius ? parseInt(radius as string) : 10000,
      limit ? parseInt(limit as string) : 20
    );
    res.json({ events });
  } catch (error) {
    console.error('Nearby events error:', error);
    res.status(500).json({ error: 'Failed to fetch nearby events' });
  }
});

/**
 * GET /events/slug/:slug
 * Get event by slug
 */
router.get('/slug/:slug', async (req: AuthRequest, res: Response) => {
  try {
    const event = await eventService.getEventBySlug(req.params.slug);
    res.json(event);
  } catch (error) {
    console.error('Get event by slug error:', error);
    res.status(404).json({ error: error.message || 'Event not found' });
  }
});

/**
 * GET /events/:id
 * Get single event
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const event = await eventService.getEvent(req.params.id, req.userId);
    res.json(event);
  } catch (error) {
    console.error('Get event error:', error);
    res.status(404).json({ error: error.message || 'Event not found' });
  }
});

/**
 * POST /events
 * Create new event
 */
router.post('/', requireUserId, async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      description,
      category,
      location,
      startDate,
      endDate,
      startTime,
      endTime,
      isPaid,
      ticketPrice,
      maxAttendees,
      coverImage,
    } = req.body;

    if (!title || !description || !category || !location || !startDate || !startTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const event = await eventService.createEvent({
      title,
      description,
      category,
      location,
      startDate,
      endDate,
      startTime,
      endTime,
      organizerId: req.userId!,
      organizerName: 'Organizer', // Would come from user profile
      isPaid,
      ticketPrice,
      maxAttendees,
      coverImage,
    });

    res.status(201).json(event);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: error.message || 'Failed to create event' });
  }
});

/**
 * POST /events/:id/interest
 * Express interest in event
 */
router.post('/:id/interest', requireUserId, async (req: AuthRequest, res: Response) => {
  try {
    const result = await eventService.expressInterest(req.params.id, req.userId!);
    res.json(result);
  } catch (error) {
    console.error('Express interest error:', error);
    res.status(500).json({ error: error.message || 'Failed to express interest' });
  }
});

export default router;
