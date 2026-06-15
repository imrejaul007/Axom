import express from 'express';
import logger from './utils/logger';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { aiRoutes } from './routes/index.js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '4010', 10);
const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

// Security: Fail fast on MongoDB in production
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

// Routes
app.use('/ai', aiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'buzzlocal-intelligence-service',
    environment: nodeEnv,
    connectedTo: {
      REZ_EVENT_PLATFORM: process.env.REZ_EVENT_PLATFORM_URL,
      REZ_RECOMMENDATIONS: process.env.REZ_UNIFIED_RECOMMENDATIONS_URL,
      REZ_TASTE_PROFILE: process.env.REZ_TASTE_PROFILE_URL,
    },
  });
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
    const uri = mongoUri || 'mongodb://localhost:27017/buzzlocal_intelligence';
    await mongoose.connect(uri, { w: 'majority', journal: true });
    logger.info('Connected to MongoDB');

    app.listen(PORT, () => {
      logger.info(`BuzzLocal Intelligence Service running on port ${PORT}`);
      logger.info(`Environment: ${nodeEnv}`);
    });
  } catch (error) {
    logger.error('Failed to start:', error);
    process.exit(1);
  }
};

start();
