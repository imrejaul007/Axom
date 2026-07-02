import express, { Request, Response } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import housingRoutes from './routes/housingRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4020;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'buzzlocal-housing-service', version: '1.0.0' });
});

// Routes
app.use('/api/housing', housingRoutes);

// Error handler
app.use((err: Error, req: Request, res: Response, next: Function) => {
  console.error(`[housing-service] Error:`, err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const startServer = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/buzzlocal-housing';
    await mongoose.connect(mongoUri);
    console.log(`[housing-service] Connected to MongoDB`);

    app.listen(PORT, () => {
      console.log(`BuzzLocal Housing Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('[housing-service] Failed to start:', error);
    process.exit(1);
  }
};

startServer();

export default app;
