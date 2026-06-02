/**
 * TrustOS Unified Gateway
 * Main entry point
 *
 * Port: 4166
 *
 * This gateway provides a unified API for:
 * - Trust scoring across all REZ products
 * - Fraud detection (integrates rez-fraud-service, rez-fraud-agent)
 * - Identity resolution (integrates REZ-unified-identity)
 * - Consent management (integrates rez-gdpr-service)
 * - Scam detection (SMS, calls, links, WhatsApp)
 */

import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

import apiRoutes from './routes/api.js';
import { logger } from './utils/logger.js';

// Configuration
const PORT = parseInt(process.env.PORT || '4166', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';

// Express app
const app = express();

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token', 'X-User-Id', 'X-Request-Id'],
  credentials: true,
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] || `req-${Date.now()}`;

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  });

  // Add request ID to response headers
  res.setHeader('X-Request-Id', requestId as string);
  next();
});

// Rate limiting (basic)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

app.use((req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 100; // per minute

  const record = requestCounts.get(ip);

  if (!record || now > record.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
  } else {
    record.count++;
    if (record.count > maxRequests) {
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later',
        },
      });
      return;
    }
  }

  next();
});

// API routes
app.use('/api/v1', apiRoutes);

// Root health check
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'TrustOS Unified Gateway',
    version: '1.0.0',
    status: 'healthy',
    documentation: '/api/v1',
    endpoints: {
      trust: '/api/v1/trust/score/:entityType/:entityId',
      fraud: '/api/v1/fraud/check',
      identity: '/api/v1/identity/resolve',
      consent: '/api/v1/consent/:userId',
      scam: '/api/v1/scam/check',
      health: '/api/v1/health',
    },
    timestamp: new Date().toISOString(),
  });
});

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
      message: NODE_ENV === 'development' ? err.message : 'Internal server error',
    },
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`TrustOS Unified Gateway started`, {
    port: PORT,
    nodeEnv: NODE_ENV,
    timestamp: new Date().toISOString(),
  });

  console.log(`
╔════════════════════════════════════════════════════════════╗
║                  TrustOS Unified Gateway                   ║
╠════════════════════════════════════════════════════════════╣
║  Status:    RUNNING                                       ║
║  Port:      ${PORT}                                             ║
║  Version:   1.0.0                                        ║
║  Mode:      ${NODE_ENV.padEnd(40)}║
╠════════════════════════════════════════════════════════════╣
║  Endpoints:                                               ║
║  • GET  /api/v1/trust/score/:type/:id                   ║
║  • POST /api/v1/fraud/check                              ║
║  • POST /api/v1/identity/resolve                        ║
║  • POST /api/v1/consent/grant                           ║
║  • POST /api/v1/scam/check                              ║
║  • GET  /api/v1/health                                  ║
╚════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app;
