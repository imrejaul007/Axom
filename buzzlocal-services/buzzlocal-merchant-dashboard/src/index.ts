/**
 * BuzzLocal Merchant Dashboard Service v1.0
 *
 * Area intelligence for local merchants - demand heatmaps, competitor analysis, footfall predictions
 *
 * Core Capabilities:
 * - Unified merchant dashboard
 * - Area demand heatmaps
 * - Footfall predictions
 * - Optimal deal timing
 * - Competitor analysis
 * - Event impact analysis
 * - Actionable recommendations
 */

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4030;

app.use(cors());
app.use(express.json());

// ===== ROUTES =====
import { dashboardRoutes } from './routes/dashboardRoutes';
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'buzzlocal-merchant-dashboard',
    version: '1.0.0',
    features: [
      'unified-dashboard',
      'demand-heatmap',
      'footfall-prediction',
      'optimal-timing',
      'competitor-analysis',
      'event-impact',
      'recommendations'
    ]
  });
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/buzzlocal_merchant_dashboard';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

// Start server
app.listen(PORT, () => {
  logger.info(
╔═══════════════════════════════════════════════════════════════╗
║       BuzzLocal Merchant Dashboard Service            ║
║                                                       ║
║  Port: ${PORT}                                           ║
║                                                       ║
║  Features:                                            ║
║  • Unified Merchant Dashboard                         ║
║  • Area Demand Heatmaps                              ║
║  • Footfall Predictions                              ║
║  • Optimal Deal Timing                               ║
║  • Competitor Analysis                              ║
║  • Event Impact Analysis                            ║
║  • AI Recommendations                               ║
║                                                       ║
║  Integrates with:                                     ║
║  • REZ Merchant Intelligence (4012)                 ║
║  • buzzlocal-density-service                         ║
║  • buzzlocal-movement-service                        ║
║  • buzzlocal-merchant-offer-service                  ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});

export { app };
