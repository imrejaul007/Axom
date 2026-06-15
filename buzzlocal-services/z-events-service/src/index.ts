import express from 'express';
import logger from './utils/logger';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { eventRoutes, ticketRoutes, organizerRoutes } from './routes/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4008;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  logger.info(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/events', eventRoutes);
app.use('/tickets', ticketRoutes);
app.use('/organizer', organizerRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'z-events-service' });
});

// Metrics
app.get('/metrics', (req, res) => {
  res.json({
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Connect to MongoDB and start server
const start = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/z_events';
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB');

    app.listen(PORT, () => {
      logger.info(`Z-Events Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => {
  logger.info('Shutting down...');
  mongoose.disconnect();
  process.exit(0);
});

start();
