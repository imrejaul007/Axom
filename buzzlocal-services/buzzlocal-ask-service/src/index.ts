import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import { askRoutes } from './routes/askRoutes';
import { errorHandler } from './middleware/errorHandler';
import { AskQuery, AskAnswer, ConversationThread } from './models/AskModels';
import { IntentRouter } from './services/IntentRouter';
import { ResponseSynthesizer } from './services/ResponseSynthesizer';
import { TrustRouter } from './services/TrustRouter';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4015;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'buzzlocal-ask-service', version: '1.0.0' });
});

// Routes
app.use('/api/ask', askRoutes);

// Error handler
app.use(errorHandler);

// Initialize services
const intentRouter = new IntentRouter();
const responseSynthesizer = new ResponseSynthesizer();
const trustRouter = new TrustRouter();

// Start server
const startServer = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/buzzlocal-ask';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    app.listen(PORT, () => {
      logger.info(Ask Buzz Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export { app, intentRouter, responseSynthesizer, trustRouter };
