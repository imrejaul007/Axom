import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { router } from './routes/crisisRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4021;

app.use(cors());
app.use(express.json());

app.get('/health', (req: any, res: any) => {
  res.json({ status: 'healthy', service: 'buzzlocal-crisis-service', version: '1.0.0' });
});

app.use('/api/crisis', router);

const start = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/buzzlocal-crisis';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
    app.listen(PORT, () => logger.info(Crisis Service running on port ${PORT}`));
  } catch (error) {
    console.error('Failed to start:', error);
    process.exit(1);
  }
};

start();
export { app };
