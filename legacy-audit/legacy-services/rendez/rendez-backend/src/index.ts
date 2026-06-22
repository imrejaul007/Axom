/**
 * Rendez - Social Events Platform
 * Events, Venues, RSVPs, Messaging
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';

dotenv.config();

import { v4 as uuidv4 } from 'uuid';

// Logger
const logger = {
  info: (msg: string) => logger.info([INFO] ${new Date().toISOString()} ${msg}`),
  error: (msg: string) => logger.error([ERROR] ${new Date().toISOString()} ${msg}`),
};

const app = express();
const PORT = parseInt(process.env.PORT || '3020', 10);

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*', credentials: true }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// ============================================
// IN-MEMORY STORES
// ============================================

const events = new Map();
const venues = new Map();
const users = new Map();
const rsvps = new Map();
const messages = new Map();
const reviews = new Map();

// ============================================
// HEALTH
// ============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'rendez',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    stats: {
      events: events.size,
      venues: venues.size,
      users: users.size,
      rsvps: rsvps.size
    }
  });
});

// ============================================
// EVENTS
// ============================================

// Create event
app.post('/api/events', (req, res) => {
  const { title, description, venueId, organizerId, startTime, endTime, capacity, category, tags, price, image } = req.body;

  if (!title || !organizerId) {
    return res.status(400).json({ success: false, error: 'title and organizerId required' });
  }

  const event = {
    id: uuidv4(),
    title,
    description: description || '',
    venueId,
    organizerId,
    startTime: new Date(startTime),
    endTime: endTime ? new Date(endTime) : null,
    capacity: capacity || 100,
    category: category || 'general',
    tags: tags || [],
    price: price || 0,
    image,
    status: 'active',
    attendeeCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  events.set(event.id, event);
  logger.info(`Event created: ${event.id}`);

  res.json({ success: true, event });
});

// Get events
app.get('/api/events', (req, res) => {
  const { category, near, startDate, endDate, limit = 50 } = req.query;

  let eventList = Array.from(events.values());

  // Filter by category
  if (category) {
    eventList = eventList.filter(e => e.category === category);
  }

  // Filter by date
  if (startDate) {
    eventList = eventList.filter(e => new Date(e.startTime) >= new Date(startDate as string));
  }
  if (endDate) {
    eventList = eventList.filter(e => new Date(e.startTime) <= new Date(endDate as string));
  }

  // Sort by date
  eventList.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  res.json({
    success: true,
    events: eventList.slice(0, Number(limit)),
    count: eventList.length
  });
});

// Get event by ID
app.get('/api/events/:eventId', (req, res) => {
  const event = events.get(req.params.eventId);

  if (!event) {
    return res.status(404).json({ success: false, error: 'Event not found' });
  }

  res.json({ success: true, event });
});

// Update event
app.put('/api/events/:eventId', (req, res) => {
  const event = events.get(req.params.eventId);

  if (!event) {
    return res.status(404).json({ success: false, error: 'Event not found' });
  }

  const updated = { ...event, ...req.body, updatedAt: new Date() };
  events.set(event.id, updated);

  res.json({ success: true, event: updated });
});

// Delete event
app.delete('/api/events/:eventId', (req, res) => {
  if (!events.has(req.params.eventId)) {
    return res.status(404).json({ success: false, error: 'Event not found' });
  }

  events.delete(req.params.eventId);
  res.json({ success: true, message: 'Event deleted' });
});

// ============================================
// VENUES
// ============================================

// Create venue
app.post('/api/venues', (req, res) => {
  const { name, address, city, capacity, amenities, images, contact, type } = req.body;

  if (!name || !address) {
    return res.status(400).json({ success: false, error: 'name and address required' });
  }

  const venue = {
    id: uuidv4(),
    name,
    address,
    city: city || '',
    capacity: capacity || 50,
    amenities: amenities || [],
    images: images || [],
    contact: contact || {},
    type: type || 'restaurant',
    rating: 0,
    reviewCount: 0,
    createdAt: new Date()
  };

  venues.set(venue.id, venue);
  logger.info(`Venue created: ${venue.id}`);

  res.json({ success: true, venue });
});

// Get venues
app.get('/api/venues', (req, res) => {
  const { city, type, limit = 50 } = req.query;

  let venueList = Array.from(venues.values());

  if (city) {
    venueList = venueList.filter(v => v.city === city);
  }
  if (type) {
    venueList = venueList.filter(v => v.type === type);
  }

  res.json({
    success: true,
    venues: venueList.slice(0, Number(limit)),
    count: venueList.length
  });
});

// Get venue by ID
app.get('/api/venues/:venueId', (req, res) => {
  const venue = venues.get(req.params.venueId);

  if (!venue) {
    return res.status(404).json({ success: false, error: 'Venue not found' });
  }

  res.json({ success: true, venue });
});

// ============================================
// RSVP
// ============================================

// RSVP to event
app.post('/api/rsvps', (req, res) => {
  const { eventId, userId, status } = req.body;

  if (!eventId || !userId) {
    return res.status(400).json({ success: false, error: 'eventId and userId required' });
  }

  const event = events.get(eventId);
  if (!event) {
    return res.status(404).json({ success: false, error: 'Event not found' });
  }

  const rsvpKey = `${eventId}:${userId}`;
  const rsvp = {
    id: uuidv4(),
    eventId,
    userId,
    status: status || 'going',
    createdAt: new Date()
  };

  rsvps.set(rsvpKey, rsvp);

  // Update event attendee count
  event.attendeeCount = Array.from(rsvps.values()).filter(r => r.eventId === eventId && r.status === 'going').length;
  events.set(eventId, event);

  logger.info(`RSVP: ${userId} -> ${eventId}`);

  res.json({ success: true, rsvp });
});

// Get RSVPs for event
app.get('/api/rsvps/event/:eventId', (req, res) => {
  const eventRsvps = Array.from(rsvps.values()).filter(r => r.eventId === req.params.eventId);

  res.json({
    success: true,
    rsvps: eventRsvps,
    count: eventRsvps.length
  });
});

// Get RSVP for user
app.get('/api/rsvps/user/:userId', (req, res) => {
  const userRsvps = Array.from(rsvps.values()).filter(r => r.userId === req.params.userId);

  res.json({
    success: true,
    rsvps: userRsvps,
    count: userRsvps.length
  });
});

// Cancel RSVP
app.delete('/api/rsvps/:eventId/:userId', (req, res) => {
  const rsvpKey = `${req.params.eventId}:${req.params.userId}`;

  if (!rsvps.has(rsvpKey)) {
    return res.status(404).json({ success: false, error: 'RSVP not found' });
  }

  rsvps.delete(rsvpKey);
  res.json({ success: true, message: 'RSVP cancelled' });
});

// ============================================
// REVIEWS
// ============================================

// Create review
app.post('/api/reviews', (req, res) => {
  const { targetId, targetType, userId, rating, comment } = req.body;

  if (!targetId || !userId || !rating) {
    return res.status(400).json({ success: false, error: 'targetId, userId, rating required' });
  }

  const review = {
    id: uuidv4(),
    targetId,
    targetType: targetType || 'venue',
    userId,
    rating,
    comment: comment || '',
    createdAt: new Date()
  };

  reviews.set(review.id, review);

  // Update venue rating
  if (targetType === 'venue') {
    const venue = venues.get(targetId);
    if (venue) {
      const venueReviews = Array.from(reviews.values()).filter(r => r.targetId === targetId);
      venue.rating = venueReviews.reduce((sum, r) => sum + r.rating, 0) / venueReviews.length;
      venue.reviewCount = venueReviews.length;
      venues.set(targetId, venue);
    }
  }

  res.json({ success: true, review });
});

// Get reviews
app.get('/api/reviews/:targetId', (req, res) => {
  const targetReviews = Array.from(reviews.values()).filter(r => r.targetId === req.params.targetId);

  res.json({
    success: true,
    reviews: targetReviews,
    count: targetReviews.length
  });
});

// ============================================
// MESSAGES (Simple chat)
// ============================================

// Send message
app.post('/api/messages', (req, res) => {
  const { senderId, receiverId, eventId, content } = req.body;

  if (!senderId || !content) {
    return res.status(400).json({ success: false, error: 'senderId and content required' });
  }

  const message = {
    id: uuidv4(),
    senderId,
    receiverId,
    eventId,
    content,
    read: false,
    createdAt: new Date()
  };

  messages.set(message.id, message);

  res.json({ success: true, message });
});

// Get messages between users
app.get('/api/messages/:userId1/:userId2', (req, res) => {
  const { userId1, userId2 } = req.params;

  const userMessages = Array.from(messages.values()).filter(m =>
    (m.senderId === userId1 && m.receiverId === userId2) ||
    (m.senderId === userId2 && m.receiverId === userId1)
  ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  res.json({
    success: true,
    messages: userMessages,
    count: userMessages.length
  });
});

// ============================================
// USERS
// ============================================

// Create user
app.post('/api/users', (req, res) => {
  const { name, email, avatar, interests } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, error: 'name required' });
  }

  const user = {
    id: uuidv4(),
    name,
    email: email || '',
    avatar: avatar || '',
    interests: interests || [],
    createdAt: new Date()
  };

  users.set(user.id, user);
  logger.info(`User created: ${user.id}`);

  res.json({ success: true, user });
});

// Get user
app.get('/api/users/:userId', (req, res) => {
  const user = users.get(req.params.userId);

  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  res.json({ success: true, user });
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((err: any, req: any, res: any, next: any) => {
  logger.error(err.message);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Start
app.listen(PORT, () => {
  logger.info(`Rendez backend started on port ${PORT}`);
});

export default app;
