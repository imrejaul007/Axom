import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { logger } from './utils/logger.js';
import { redisClient } from './utils/redis.js';
import analysisRoutes from './routes/analysisRoutes.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
});
app.use('/api/', limiter);

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request processed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });
  });
  next();
});

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const redisStatus = redisClient.isReady() ? 'connected' : 'disconnected';

  const status = mongoStatus === 'connected' && redisStatus === 'connected' ? 'healthy' : 'degraded';

  res.json({
    status,
    version: '1.0.0',
    uptime: process.uptime(),
    dependencies: {
      mongodb: mongoStatus,
      redis: redisStatus,
    },
  });
});

// API routes
app.use('/api/analysis', analysisRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An internal server error occurred',
    },
  });
});

// Database connection
async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(config.mongodb.uri);
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection failed', { error });
    throw error;
  }
}

// Redis connection
async function connectRedis(): Promise<void> {
  try {
    await redisClient.connect();
 } catch (error) {
    logger.warn('Redis connection failed, continuing without cache', { error });
  }
}

// Graceful shutdown
async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, shutting down gracefully...`);

  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error('Error closing MongoDB connection', { error });
  }

  try {
    await redisClient.disconnect();
  } catch (error) {
    logger.error('Error closing Redis connection', { error });
  }

  process.exit(0);
}

// Start server
async function startServer(): Promise<void> {
  try {
    await connectDatabase();
    await connectRedis();

    app.listen(config.port, () => {
      logger.info(`BuzzLocal Intelligence Service started on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
    });

    // Handle shutdown signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

startServer();

export default app;