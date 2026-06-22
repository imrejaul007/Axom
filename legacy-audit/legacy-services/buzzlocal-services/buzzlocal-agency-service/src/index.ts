import express, { Request, Response } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cron from 'node-cron';

import { logger } from '../shared/utils/logger';
import { agencyRoutes } from './routes/agencyRoutes';
import { webhookRoutes } from './routes/webhookRoutes';
import { errorHandler } from './middleware/errorHandler';
import { AgencyFetcher } from './services/AgencyFetcher';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4018;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'buzzlocal-agency-service', version: '1.0.0' });
});

// Routes
app.use('/api/alerts', agencyRoutes);
app.use('/api/alerts/webhook', webhookRoutes);

// Initialize services
const agencyFetcher = new AgencyFetcher();

// Cron jobs for fetching agency data
// Metro updates every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  logger.info('Cron: Fetching metro updates...');
  await agencyFetcher.fetchMetroUpdates();
});

// Weather alerts every 15 minutes
cron.schedule('*/15 * * * *', async () => {
  logger.info('Cron: Fetching weather alerts...');
  await agencyFetcher.fetchWeatherAlerts();
});

// BESCOM updates every 30 minutes
cron.schedule('*/30 * * * *', async () => {
  logger.info('Cron: Fetching BESCOM updates...');
  await agencyFetcher.fetchBESCOMUpdates();
});

// Error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/buzzlocal-agency';
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB');

    // Initial fetch
    await agencyFetcher.initialize();

    app.listen(PORT, () => {
      logger.startup(PORT, ['Agency Alerts', 'Weather Updates', 'Traffic Updates']);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: String(error) });
    process.exit(1);
  }
};

startServer();

export { app };
