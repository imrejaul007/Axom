import express, { Request, Response } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { logger } from '../../shared/utils/logger';
import { safetyRoutes } from './routes/safetyRoutes';
import { errorHandler } from './middleware/errorHandler';
import { AlertProcessor } from './services/AlertProcessor';
import { CredibilityEngine } from './services/CredibilityEngine';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4017;
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'buzzlocal-safety-service', version: '1.0.0' });
});

// Routes
app.use('/api/safety', safetyRoutes);

// Socket.IO for real-time alerts
io.on('connection', (socket) => {
  logger.debug('Socket connected', { socketId: socket.id });

  // Join area room for alerts
  socket.on('subscribe:area', (areaId: string) => {
    socket.join(`area:${areaId}`);
    logger.debug('Socket subscribed to area', { socketId: socket.id, areaId });
  });

  // Leave area room
  socket.on('unsubscribe:area', (areaId: string) => {
    socket.leave(`area:${areaId}`);
  });

  // Subscribe to safety alerts
  socket.on('subscribe:alerts', () => {
    socket.join('alerts:all');
  });

  socket.on('disconnect', () => {
    logger.debug('Socket disconnected', { socketId: socket.id });
  });
});

// Alert processor
const alertProcessor = new AlertProcessor(io);
const credibilityEngine = new CredibilityEngine();

// Make io accessible to routes
app.set('io', io);
app.set('alertProcessor', alertProcessor);
app.set('credibilityEngine', credibilityEngine);

// Error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/buzzlocal-safety';
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB');

    httpServer.listen(PORT, () => {
      logger.startup(PORT, ['sos-triggers', 'trusted-circle', 'safe-zones', 'real-time-location']);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: String(error) });
    process.exit(1);
  }
};

startServer();

export { app, io };
