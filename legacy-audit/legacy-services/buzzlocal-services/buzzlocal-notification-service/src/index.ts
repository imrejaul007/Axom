import express from 'express';
import logger from './utils/logger';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { notificationRoutes } from './routes/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4011;
const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

// Security: Fail fast on missing MongoDB in production
const mongoUri = process.env.MONGODB_URI;
if (isProduction && !mongoUri) {
  throw new Error('[FATAL] MONGODB_URI is required in production');
}

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

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'Too Many Requests', code: 'RATE_LIMIT_EXCEEDED' },
  skip: (req) => ['/health'].some(p => req.path === p)
});
app.use(limiter);

// Middleware
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json({ limit: '100kb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/notifications', notificationRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'buzzlocal-notification-service', environment: nodeEnv });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  if (err.message.includes('CORS')) {
    return res.status(403).json({ error: 'Forbidden', message: 'Origin not allowed' });
  }
  res.status(500).json({ error: 'Internal server error' });
});

// Connect to MongoDB and start server
const start = async () => {
  try {
    if (!mongoUri) {
      throw new Error('MONGODB_URI is required');
    }
    await mongoose.connect(mongoUri, { w: 'majority', journal: true });
    logger.info('Connected to MongoDB');

    app.listen(PORT, () => {
      logger.info(`BuzzLocal Notification Service running on port ${PORT}`);
      logger.info(`Environment: ${nodeEnv}`);
    });
  } catch (error) {
    logger.error('Failed to start:', error);
    process.exit(1);
  }
};

start();

process.on('SIGTERM', () => {
  logger.info('Shutting down...');
  mongoose.disconnect();
  process.exit(0);
});

start();
