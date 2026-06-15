import { Router, Request, Response, NextFunction } from 'express';
import { eventService } from '../services/eventService.js';

const router = Router();

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => { Promise.resolve(fn(req, res, next)).catch(next); };

// Create event
router.post('/events', asyncHandler(async (req: Request, res: Response) => {
  const { title, description, organizerId, location, startDate, endDate, coverImage, category, isPublic, capacity, ticketPrice } = req.body;
  if (!title || !description || !organizerId || !location || !startDate || !endDate || !category || !capacity) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } });
  }
  const event = await eventService.createEvent({ title, description, organizerId, location, startDate, endDate, coverImage, category, isPublic, capacity, ticketPrice });
  return res.status(201).json({ success: true, data: event });
}));

// Get event
router.get('/events/:id', asyncHandler(async (req: Request, res: Response) => {
  const event = await eventService.getEvent(req.params.id);
  if (!event) { return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Event not found' } }); }
  return res.json({ success: true, data: event });
}));

// Get nearby events
router.get('/events/nearby', asyncHandler(async (req: Request, res: Response) => {
  const { latitude, longitude, radius = '10000', category } = req.query;
  if (!latitude || !longitude) { return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'latitude and longitude are required' } }); }
  const events = await eventService.getNearbyEvents(parseFloat(latitude as string), parseFloat(longitude as string), parseInt(radius as string, 10), category as string);
  return res.json({ success: true, data: { events } });
}));

// Get upcoming events
router.get('/events', asyncHandler(async (req: Request, res: Response) => {
  const { limit = '20', offset = '0' } = req.query;
  const result = await eventService.getUpcomingEvents(parseInt(limit as string, 10), parseInt(offset as string, 10));
  return res.json({ success: true, data: { items: result.events, total: result.total } });
}));

// RSVP to event
router.post('/rsvp', asyncHandler(async (req: Request, res: Response) => {
  const { eventId, userId, status } = req.body;
  if (!eventId || !userId || !status) { return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'eventId, userId, and status are required' } }); }
  const rsvp = await eventService.rsvpEvent({ eventId, userId, status });
  return res.json({ success: true, data: rsvp });
}));

// Get RSVPs for event
router.get('/events/:id/rsvp', asyncHandler(async (req: Request, res: Response) => {
  const rsvps = await eventService.getRSVPs(req.params.id);
  return res.json({ success: true, data: rsvps });
}));

// Purchase ticket
router.post('/tickets', asyncHandler(async (req: Request, res: Response) => {
  const { eventId, userId } = req.body;
  if (!eventId || !userId) { return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'eventId and userId are required' } }); }
  try {
    const ticket = await eventService.purchaseTicket(eventId, userId);
    return res.status(201).json({ success: true, data: ticket });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message } });
  }
}));

// Check in ticket
router.post('/tickets/:ticketNumber/checkin', asyncHandler(async (req: Request, res: Response) => {
  try {
    const ticket = await eventService.checkInTicket(req.params.ticketNumber);
    return res.json({ success: true, data: ticket });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message } });
  }
}));

// Get user tickets
router.get('/users/:userId/tickets', asyncHandler(async (req: Request, res: Response) => {
  const { limit = '20', offset = '0' } = req.query;
  const result = await eventService.getUserTickets(req.params.userId, parseInt(limit as string, 10), parseInt(offset as string, 10));
  return res.json({ success: true, data: { items: result.tickets, total: result.total } });
}));

// Get user RSVPs
router.get('/users/:userId/rsvp', asyncHandler(async (req: Request, res: Response) => {
  const rsvps = await eventService.getUserRSVPs(req.params.userId);
  return res.json({ success: true, data: { rsvps } });
}));

export default router;