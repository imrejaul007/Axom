/**
 * BuzzLocal Movement Graph Service v1.0
 *
 * Tracks user movement patterns, area-to-area flows, and commute intelligence.
 *
 * Core Capabilities:
 * - Movement Event Tracking (check-ins, check-outs, transits)
 * - Area-to-Area Flow Analysis
 * - User Commute Pattern Detection
 * - Movement Hotspot Identification
 * - Arrival Predictions
 * - Movement Corridor Analysis
 */

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4028;

app.use(cors());
app.use(express.json());

// ===== ROUTES =====
import { movementRoutes } from './routes/movementRoutes';
app.use('/api/movement', movementRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'buzzlocal-movement-graph',
    version: '1.0.0',
    capabilities: [
      'movement-tracking',
      'flow-analysis',
      'commute-detection',
      'hotspot-identification',
      'arrival-prediction',
      'corridor-analysis'
    ]
  });
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/buzzlocal_movement';

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
║       BuzzLocal Movement Graph Service              ║
║                                                       ║
║  Port: ${PORT}                                           ║
║                                                       ║
║  Capabilities:                                         ║
║  • Movement Event Tracking                            ║
║  • Area-to-Area Flow Analysis                        ║
║  • Commute Pattern Detection                         ║
║  • Movement Hotspot Identification                   ║
║  • Arrival Predictions                               ║
║  • Movement Corridor Analysis                        ║
║                                                       ║
║  Integrates with:                                     ║
║  • buzzlocal-density-service (crowd data)            ║
║  • buzzlocal-vibe-service (check-ins)                ║
║  • REZ Intelligence (predictions)                    ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});

export { app };
