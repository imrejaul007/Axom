import 'dotenv/config';
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

import { config } from './config.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { emotionRouter } from './routes/emotion.js';

/**
 * Health check response type.
 * @typedef {Object} HealthResponse
 * @property {string} status - Service status indicator
 * @property {string} service - Service name
 * @property {string} timestamp - ISO timestamp of the health check
 * @property {{ uptime: number }} metrics - Service uptime in seconds
 */
interface HealthResponse {
  status: string;
  service: string;
  timestamp: string;
  metrics: {
    uptime: number;
  };
}

/**
 * Creates and configures the Express application with all middleware and routes.
 * @returns {Express} Configured Express application instance
 */
function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(requestLogger);

  /**
   * @route GET /health
   * @desc Health check endpoint for container orchestration and monitoring
   * @access Public
   */
  app.get('/health', (_req: Request, res: Response) => {
    /**
     * @type {HealthResponse}
     */
    const response: HealthResponse = {
      status: 'healthy',
      service: 'rez-emotional-intelligence',
      timestamp: new Date().toISOString(),
      metrics: {
        uptime: process.uptime(),
      },
    };
    res.json(response);
  });

  app.use('/api/emotion', emotionRouter);

  app.use(errorHandler);

  return app;
}

/**
 * @type {Express}
 */
const app = createApp();

/**
 * Start the HTTP server.
 */
const server = app.listen(config.PORT, () => {
  console.log(
    `REZ Emotional Intelligence service running on port ${config.PORT} (${config.NODE_ENV})`
  );
});

export { app, createApp, server };
export default app;
