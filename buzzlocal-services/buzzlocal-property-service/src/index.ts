import express, { Request, Response } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import propertyRoutes from './routes/propertyRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4021;

app.use(cors());
app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'buzzlocal-property-service', version: '1.0.0' });
});

app.use('/api/property', propertyRoutes);

app.use((err: Error, req: Request, res: Response, next: Function) => {
  console.error(`[property-service] Error:`, err.message);
  res.status(500).json({ error: 'Internal server error' });
});

const startServer = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/buzzlocal-property';
    await mongoose.connect(mongoUri);
    console.log(`[property-service] Connected to MongoDB`);

    app.listen(PORT, () => {
      console.log(`BuzzLocal PropertyOS running on port ${PORT}`);
    });
  } catch (error) {
    console.error('[property-service] Failed to start:', error);
    process.exit(1);
  }
};

startServer();

export default app;
