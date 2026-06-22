/**
 * BuzzLocal OO2I (Offline-to-Online) Service v1.0
 *
 * QR Infrastructure, Location Triggers, DOOH Integration
 *
 * Core Capabilities:
 * - QR Kiosk Management
 * - QR Scan Tracking & Analytics
 * - Location-based Triggers
 * - DOOH Screen Integration
 * - Offline-to-Online Attribution
 */

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4031;

app.use(cors());
app.use(express.json());

// ===== ROUTES =====
import { oo2iRoutes } from './routes/oo2iRoutes';
app.use('/api/oo2i', oo2iRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'buzzlocal-oo2i-service',
    version: '1.0.0',
    features: [
      'qr-kiosks',
      'qr-scanning',
      'location-triggers',
      'dooh-integration',
      'attribution'
    ]
  });
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/buzzlocal_oo2i';

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
║       BuzzLocal OO2I Service                        ║
║                                                       ║
║  Port: ${PORT}                                           ║
║                                                       ║
║  Features:                                            ║
║  • QR Kiosk Management                              ║
║  • QR Scan Tracking                                  ║
║  • Location-based Triggers                          ║
║  • DOOH Screen Integration                          ║
║  • Attribution Analytics                             ║
║                                                       ║
║  Integrates with:                                     ║
║  • REZ DOOH Service (4018)                         ║
║  • Notifications Service (4011)                      ║
║  • Movement Service (4028)                          ║
║  • Creator QR Service (3005)                         ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});

export { app };
