/**
 * BuzzLocal SOS Service - Critical Real-Time Safety Infrastructure
 *
 * This is ONE of the few features that genuinely needs WebSockets.
 * All other features can use polling.
 *
 * Features:
 * - Live SOS triggers (critical - needs real-time)
 * - Trusted circle location sharing
 * - Emergency alert broadcasting
 * - Safe route suggestions
 */

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { Server as SocketServer } from 'socket.io';
import { createServer } from 'http';
import { logger } from '../../shared/utils/logger';

const app = express();
const PORT = process.env.PORT || 4023;
const HTTP_SERVER = createServer(app);
const io = new SocketServer(HTTP_SERVER, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// ===== MONGODB MODELS =====

// SOS Event Schema
const sosEventSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  type: { type: String, enum: ['panic', 'medical', 'safety', 'fake_call'], required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    area: String
  },
  status: { type: String, enum: ['active', 'acknowledged', 'resolved', 'cancelled'], default: 'active' },
  trustedCircle: [{ type: String }], // User IDs of trusted contacts
  responders: [{
    responderId: String,
    responderType: { type: String, enum: ['user', 'guardian', 'police', 'ambulance'] },
    status: { type: String, enum: ['dispatched', 'en_route', 'arrived', 'resolved'] },
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  resolvedAt: Date
});

const SOSEvent = mongoose.model('SOSEvent', sosEventSchema);

// Trusted Circle Schema
const trustedCircleSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  members: [{
    memberId: String,
    relationship: String,
    notifySettings: {
      sos: { type: Boolean, default: true },
      arrive: { type: Boolean, default: true },
      leave: { type: Boolean, default: false }
    }
  }],
  updatedAt: { type: Date, default: Date.now }
});

const TrustedCircle = mongoose.model('TrustedCircle', trustedCircleSchema);

// Safe Zone Schema
const safeZoneSchema = new mongoose.Schema({
  name: String,
  location: {
    lat: Number,
    lng: Number
  },
  radius: { type: Number, default: 100 }, // meters
  type: { type: String, enum: ['police', 'hospital', 'mall', 'cafe', 'guardian'] },
  rating: { type: Number, default: 4.0 },
  amenities: [String],
  contact: String,
  is24x7: { type: Boolean, default: false },
  area: String
});

const SafeZone = mongoose.model('SafeZone', safeZoneSchema);

// ===== SOCKET.IO HANDLERS =====

interface AuthenticatedSocket {
  userId: string;
  emit: (event: string, data: any) => void;
  join: (room: string) => void;
  leave: (room: string) => void;
  on: (event: string, handler: (...args: any[]) => void) => void;
}

const connectedUsers = new Map<string, Set<string>>(); // userId -> Set of socket IDs

io.on('connection', (socket: AuthenticatedSocket) => {
  logger.debug('Client connected', { socketId: socket.id });

  // User authentication
  socket.on('authenticate', (data: { userId: string }) => {
    socket.userId = data.userId;

    if (!connectedUsers.has(data.userId)) {
      connectedUsers.set(data.userId, new Set());
    }
    connectedUsers.get(data.userId)!.add(socket.id);

    // Join user's personal room for targeted messages
    socket.join(`user:${data.userId}`);

    // Join area room for local alerts
    socket.on('join-area', (area: string) => {
      socket.join(`area:${area}`);
    });

    logger.debug('User authenticated', { userId: data.userId });
  });

  // SOS Trigger - CRITICAL REAL-TIME
  socket.on('sos-trigger', async (data: {
    type: string;
    lat: number;
    lng: number;
    area: string;
  }) => {
    if (!socket.userId) return;

    try {
      // Create SOS event
      const sosEvent = new SOSEvent({
        userId: socket.userId,
        type: data.type,
        location: {
          lat: data.lat,
          lng: data.lng,
          area: data.area
        },
        trustedCircle: [] // Will be populated from user's circle
      });

      await sosEvent.save();

      // Notify trusted circle members in real-time
      const circle = await TrustedCircle.findOne({ userId: socket.userId });
      if (circle) {
        for (const member of circle.members) {
          io.to(`user:${member.memberId}`).emit('sos-alert', {
            eventId: sosEvent._id,
            from: socket.userId,
            type: data.type,
            location: data,
            timestamp: sosEvent.createdAt
          });
        }
      }

      // Broadcast to nearby guardians/authorities
      io.to(`area:${data.area}`).emit('sos-nearby', {
        eventId: sosEvent._id,
        location: data,
        type: data.type,
        timestamp: sosEvent.createdAt
      });

      // Confirm to sender
      socket.emit('sos-confirmed', {
        eventId: sosEvent._id,
        status: 'active',
        responders: []
      });

    } catch (error) {
      logger.error('SOS trigger error', { error: String(error) });
      socket.emit('sos-error', { message: 'Failed to trigger SOS' });
    }
  });

  // Location sharing (for trusted circle tracking)
  socket.on('location-update', (data: {
    lat: number;
    lng: number;
    accuracy: number;
    speed: number;
    sharingWith: string[] // User IDs
  }) => {
    if (!socket.userId) return;

    // Send to each person in the sharing list
    for (const userId of data.sharingWith) {
      io.to(`user:${userId}`).emit('friend-location', {
        userId: socket.userId,
        location: {
          lat: data.lat,
          lng: data.lng,
          accuracy: data.accuracy,
          speed: data.speed,
          timestamp: Date.now()
        }
      });
    }
  });

  // Walk with me - Start tracking session
  socket.on('walk-with-me-start', (data: {
    trustedUserId: string; // Who is watching
    lat: number;
    lng: number;
  }) => {
    if (!socket.userId) return;

    // Notify the trusted user
    io.to(`user:${data.trustedUserId}`).emit('walk-started', {
      userId: socket.userId,
      location: { lat: data.lat, lng: data.lng },
      startedAt: Date.now()
    });

    // Create session room
    socket.join(`walk:${socket.userId}`);
    io.to(`user:${data.trustedUserId}`).join(`walk:${socket.userId}`);
  });

  // Walk with me - Location updates
  socket.on('walk-location', (data: {
    lat: number;
    lng: number;
    eta: number; // Estimated time to destination
  }) => {
    if (!socket.userId) return;

    // Broadcast to everyone watching
    io.to(`walk:${socket.userId}`).emit('walk-location-update', {
      userId: socket.userId,
      location: { lat: data.lat, lng: data.lng },
      eta: data.eta,
      timestamp: Date.now()
    });
  });

  // Walk with me - End session
  socket.on('walk-with-me-end', () => {
    if (!socket.userId) return;

    io.to(`walk:${socket.userId}`).emit('walk-ended', {
      userId: socket.userId,
      endedAt: Date.now()
    });

    socket.leave(`walk:${socket.userId}`);
  });

  // Emergency responder updates
  socket.on('responder-update', (data: {
    eventId: string;
    status: string;
    lat?: number;
    lng?: number;
  }) => {
    // Broadcast to all parties involved
    io.to(`sos:${data.eventId}`).emit('responder-status', {
      ...data,
      timestamp: Date.now()
    });
  });

  // Cancel SOS
  socket.on('sos-cancel', async (eventId: string) => {
    if (!socket.userId) return;

    await SOSEvent.findByIdAndUpdate(eventId, {
      status: 'cancelled',
      resolvedAt: new Date()
    });

    io.to(`sos:${eventId}`).emit('sos-cancelled', {
      eventId,
      cancelledAt: Date.now()
    });
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    if (socket.userId) {
      const userSockets = connectedUsers.get(socket.userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          connectedUsers.delete(socket.userId);
        }
      }
    }
    logger.debug('Client disconnected', { socketId: socket.id });
  });
});

// ===== REST API ROUTES =====

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'buzzlocal-safety-service',
    version: '1.0.0',
    features: [
      'sos-triggers',
      'trusted-circle',
      'safe-zones',
      'real-time-location'
    ],
    activeConnections: connectedUsers.size,
    activeSOS: 0 // Would query DB
  });
});

// Trigger SOS (fallback for non-WebSocket)
app.post('/api/sos', async (req, res) => {
  try {
    const { userId, type, lat, lng, area } = req.body;

    const sosEvent = new SOSEvent({
      userId,
      type,
      location: { lat, lng, area }
    });

    await sosEvent.save();

    // Notify via Socket
    io.to(`user:${userId}`).emit('sos-confirmed', {
      eventId: sosEvent._id,
      status: 'active'
    });

    res.json({ success: true, eventId: sosEvent._id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create SOS event' });
  }
});

// Get active SOS events for user
app.get('/api/sos/active/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const events = await SOSEvent.find({
      userId,
      status: { $in: ['active', 'acknowledged'] }
    }).sort({ createdAt: -1 });

    res.json({ events });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch SOS events' });
  }
});

// Get trusted circle
app.get('/api/trusted-circle/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const circle = await TrustedCircle.findOne({ userId }) || { members: [] };

    res.json(circle);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trusted circle' });
  }
});

// Update trusted circle
app.post('/api/trusted-circle/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { members } = req.body;

    const circle = await TrustedCircle.findOneAndUpdate(
      { userId },
      { members, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    res.json(circle);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update trusted circle' });
  }
});

// Get nearby safe zones
app.get('/api/safe-zones', async (req, res) => {
  try {
    const { lat, lng, radius = 5000, type } = req.query;

    // Simple bounding box query (would use geospatial in production)
    const latDelta = Number(radius) / 111000;
    const lngDelta = Number(radius) / (111000 * Math.cos(Number(lat) * Math.PI / 180));

    const query: any = {
      'location.lat': { $gte: Number(lat) - latDelta, $lte: Number(lat) + latDelta },
      'location.lng': { $gte: Number(lng) - lngDelta, $lte: Number(lng) + lngDelta }
    };

    if (type) query.type = type;

    const zones = await SafeZone.find(query).limit(20);

    res.json({ zones });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch safe zones' });
  }
});

// Report incident
app.post('/api/incident', async (req, res) => {
  try {
    const { userId, type, lat, lng, area, description, anonymous } = req.body;

    // In production, would save to incidents collection
    // and potentially trigger alerts to nearby users

    res.json({ success: true, incidentId: `INC-${Date.now()}` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to report incident' });
  }
});

// Get safe route
app.get('/api/safe-route', async (req, res) => {
  try {
    const { fromLat, fromLng, toLat, toLng, mode = 'walk' } = req.query;

    // In production, would integrate with maps API
    // and factor in: well-lit areas, busy roads, safe zones

    const route = {
      path: [
        { lat: Number(fromLat), lng: Number(fromLng) },
        { lat: Number(fromLat) + 0.002, lng: Number(fromLng) + 0.001 },
        { lat: Number(toLat), lng: Number(toLng) }
      ],
      distance: '2.5 km',
      estimatedTime: '18 mins',
      safetyScore: 87,
      safeZonesNearby: [
        { name: 'Forum Mall', distance: '0.3 km' },
        { name: 'Police Station', distance: '0.5 km' }
      ],
      wellLitRoads: true,
      busyCrossroads: 3
    };

    res.json(route);
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate safe route' });
  }
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/buzzlocal_safety';

mongoose.connect(MONGODB_URI)
  .then(() => logger.info('Connected to MongoDB'))
  .catch((err) => logger.error('MongoDB connection error', { error: String(err) }));

// Start server
HTTP_SERVER.listen(PORT, () => {
  logger.startup(PORT, [
    'SOS Triggers',
    'Trusted Circle Location Sharing',
    'Walk With Me Tracking',
    'Emergency Responder Updates',
    'Safe Zones Discovery',
    'Incident Reporting',
    'Safe Route Calculation',
    'Trusted Circle Management'
  ]);
});

export { app, io };
