import express from 'express';
import logger from './utils/logger';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { vibeRoutes, checkinRoutes } from './routes/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4003;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  logger.info(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/vibe', vibeRoutes);
app.use('/checkin', checkinRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'buzzlocal-vibe-service' });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Connect to MongoDB and start server
const start = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/buzzlocal_vibe';
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB');

    app.listen(PORT, () => {
      logger.info(`BuzzLocal Vibe Service running on port ${PORT}`);
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
