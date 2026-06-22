import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { router } from './routes/offerRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4023;

app.use(cors());
app.use(express.json());

app.get('/health', (req: any, res: any) => {
  res.json({ status: 'healthy', service: 'buzzlocal-merchant-offer-service', version: '1.0.0' });
});

app.use('/api/offers', router);

const start = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/buzzlocal-offers';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
    app.listen(PORT, () => logger.info(Merchant Offer Service running on port ${PORT}`));
  } catch (error) {
    console.error('Failed to start:', error);
    process.exit(1);
  }
};

start();
export { app };
