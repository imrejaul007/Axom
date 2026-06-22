import express from 'express';
import logger from './utils/logger';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server as SocketIOServer } from 'socket.io';
import rateLimit from 'express-rate-limit';
import { SocketService } from './services/socketService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4012;
const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

// Create HTTP server for Socket.IO
const httpServer = createServer(app);

// CORS - explicit origins only
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').filter(Boolean) || [];
if (isProduction && allowedOrigins.length === 0) {
  throw new Error('[FATAL] ALLOWED_ORIGINS is required in production');
}

const corsOrigin = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
  if (!origin) return callback(null, true);
  if (!isProduction && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
    return callback(null, true);
  }
  if (allowedOrigins.includes(origin)) {
    return callback(null, true);
  }
  callback(new Error(`Origin ${origin} not allowed by CORS policy`));
};

// Initialize Socket.IO with CORS
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Rate limiting for REST endpoints
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'Too Many Requests', code: 'RATE_LIMIT_EXCEEDED' },
  skip: (req) => ['/health', '/metrics'].some(p => req.path === p),
});

app.use(limiter);
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: '100kb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Initialize socket service
const socketService = new SocketService(io);

// REST endpoints
app.post('/emit', (req, res) => {
  const { event, data, room, area, userId } = req.body;

  if (!event) {
    return res.status(400).json({ success: false, error: 'Event name required' });
  }

  try {
    if (area) {
      socketService.sendToArea(area, event, data);
    } else if (room) {
      socketService.sendToRoom(room, event, data);
    } else if (userId) {
      socketService.sendToUser(userId, event, data);
    } else {
      socketService.broadcast(event, data);
    }

    res.json({ success: true, event });
  } catch (error) {
    logger.error('Emit error:', error);
    res.status(500).json({ success: false, error: 'Failed to emit event' });
  }
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'buzzlocal-realtime-service',
    environment: nodeEnv,
    connectedUsers: socketService.getConnectedCount(),
  });
});

app.get('/metrics', (req, res) => {
  res.json({
    connectedUsers: socketService.getConnectedCount(),
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Error:', err);
  if (err.message.includes('CORS')) {
    return res.status(403).json({ error: 'Forbidden', message: 'Origin not allowed' });
  }
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
httpServer.listen(PORT, () => {
  logger.info(`BuzzLocal Realtime Service running on port ${PORT}`);
  logger.info(`Environment: ${nodeEnv}`);
  logger.info(`CORS origins: ${isProduction ? allowedOrigins.join(', ') : 'all (development)'}`);
});

export { app, io };
