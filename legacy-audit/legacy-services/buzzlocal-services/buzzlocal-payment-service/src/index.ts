import express from 'express';
import logger from './utils/logger';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { paymentRoutes } from './routes/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4013;

// Middleware
app.use(cors());

// Webhook needs raw body
app.use('/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  logger.info(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/payments', paymentRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'buzzlocal-payment-service',
    razorpayConfigured: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
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
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/buzzlocal_payments';
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB');

    app.listen(PORT, () => {
      logger.info(`BuzzLocal Payment Service running on port ${PORT}`);
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
