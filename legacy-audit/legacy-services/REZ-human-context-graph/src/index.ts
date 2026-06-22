/**
 * REZ Human Context Graph - Main Application Entry Point.
 * @module index
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { getConfigSingleton } from './config.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import contextGraphRoutes from './routes/contextGraph.js';

/**
 * Creates and configures the Express application.
 * @returns Configured Express app instance
 */
export function createApp(): express.Application {
  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS configuration
  app.use(cors({
    origin: process.env.NODE_ENV === 'production'
      ? false
      : true,
    credentials: true,
  }));

  // Compression
  app.use(compression());

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging
  app.use(requestLogger);

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'rez-human-context-graph',
    });
  });

  // API routes
  app.use('/api/graph', contextGraphRoutes);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: 'Not found',
    });
  });

  // Error handler
  app.use(errorHandler);

  return app;
}

/**
 * Starts the Express server.
 */
async function startServer(): Promise<void> {
  try {
    const config = getConfigSingleton();
    const app = createApp();

    const server = app.listen(config.port, () => {
      logger.info(REZ Human Context Graph service running on port ${config.port}`);
      logger.info(Environment: ${config.nodeEnv}`);
      logger.info(Health check: http://localhost:${config.port}/health`);
    });

    // Graceful shutdown
    const shutdown = (signal: string) => {
      logger.info(\n${signal} received. Shutting down gracefully...`);
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });

      // Force exit after 10 seconds
      setTimeout(() => {
        console.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start server if this is the main module
startServer();