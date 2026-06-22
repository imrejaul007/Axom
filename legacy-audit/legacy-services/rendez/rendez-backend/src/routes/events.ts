/**
 * Rendez Backend - Event Routes
 * @module routes/events
 */

import { Router } from 'express';
import { EventService } from '../services/eventService.js';
import { ChatService } from '../services/chatService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// Get all events
router.get('/', asyncHandler(async (_req, res) => {
  const events = EventService.getActive();
  res.json({ success: true, data: events });
}));

// Get event by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const event = EventService.getById(req.params.id);
  if (!event) {
    res.status(404).json({ success: false, error: 'Event not found' });
    return;
  }
  res.json({ success: true, data: event });
}));

// Create event
router.post('/', asyncHandler(async (req, res) => {
  const { title, description, date, location, createdBy, maxAttendees, tags, latitude, longitude } = req.body;

  if (!title || !date || !location || !createdBy) {
    res.status(400).json({ success: false, error: 'Missing required fields' });
    return;
  }

  const event = EventService.create(
    title,
    description || '',
    new Date(date),
    location,
    createdBy,
    maxAttendees || 50,
    tags || [],
    latitude,
    longitude
  );

  res.status(201).json({ success: true, data: event });
}));

// Update event
router.put('/:id', asyncHandler(async (req, res) => {
  const event = EventService.update(req.params.id, req.body);
  if (!event) {
    res.status(404).json({ success: false, error: 'Event not found' });
    return;
  }
  res.json({ success: true, data: event });
}));

// Delete event
router.delete('/:id', asyncHandler(async (req, res) => {
  const deleted = EventService.delete(req.params.id);
  if (!deleted) {
    res.status(404).json({ success: false, error: 'Event not found' });
    return;
  }
  res.json({ success: true });
}));

// RSVP to event
router.post('/:id/rsvp', asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    res.status(400).json({ success: false, error: 'userId required' });
    return;
  }

  const rsvp = EventService.rsvp(req.params.id, userId);
  if (!rsvp) {
    res.status(400).json({ success: false, error: 'RSVP failed' });
    return;
  }

  res.status(201).json({ success: true, data: rsvp });
}));

// Cancel RSVP
router.delete('/:id/rsvp', asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    res.status(400).json({ success: false, error: 'userId required' });
    return;
  }

  const cancelled = EventService.cancelRsvp(req.params.id, userId);
  res.json({ success: cancelled });
}));

// Search events
router.get('/search/:query', asyncHandler(async (req, res) => {
  const events = EventService.search(req.params.query);
  res.json({ success: true, data: events });
}));

// Get event chat
router.get('/:id/chat', asyncHandler(async (req, res) => {
  const messages = ChatService.getMessages(req.params.id);
  res.json({ success: true, data: messages });
}));

// Send chat message
router.post('/:id/chat', asyncHandler(async (req, res) => {
  const { userId, userName, content } = req.body;
  if (!userId || !userName || !content) {
    res.status(400).json({ success: false, error: 'Missing required fields' });
    return;
  }

  const message = ChatService.sendMessage(req.params.id, userId, userName, content);
  res.status(201).json({ success: true, data: message });
}));

export { router as eventRouter };