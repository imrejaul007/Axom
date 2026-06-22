/**
 * REZ Trust OS - Main Entry Point
 * @module index
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config, isProduction } from './config.js';
import { trustRouter } from './routes/trust.js';
import { identityRouter } from './routes/identity.js';
import { fraudRouter } from './routes/fraud.js';
import { reputationRouter } from './routes/reputation.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: isProduction ? config.services.complianceGateway : '*',
  credentials: true,
}));

// Compression and parsing
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'REZ Trust OS',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/trust', trustRouter);
app.use('/api/identity', identityRouter);
app.use('/api/fraud', fraudRouter);
app.use('/api/reputation', reputationRouter);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
  });
});

// Start server
app.listen(config.port, () => {
  logger.info(REZ Trust OS running on port ${config.port}`);
  logger.info(Environment: ${config.nodeEnv}`);
  logger.info(MongoDB: ${config.mongodb.uri}`);
});

export default app;