/**
 * BuzzLocal Creator Service v1.0
 *
 * Local Creator Layer - Area Ambassadors, Creators, Content Amplification
 *
 * Core Capabilities:
 * - Creator Profiles & Tiers
 * - Area-Specialized Roles (Food Scout, Safety Guardian, etc.)
 * - Content Creation & Amplification
 * - Creator Programs & Gamification
 * - Earnings & Rewards System
 */

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4029;

app.use(cors());
app.use(express.json());

// ===== ROUTES =====
import { creatorRoutes } from './routes/creatorRoutes';
app.use('/api/creator', creatorRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'buzzlocal-creator-service',
    version: '1.0.0',
    roles: [
      'food_scout',
      'nightlife_expert',
      'safety_guardian',
      'event_ambassador',
      'community_leader',
      'deal_hunter',
      'trust_advocate',
      'area_ambassador'
    ],
    tiers: ['rising', 'local', 'expert', 'authority']
  });
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/buzzlocal_creators';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

// Initialize default programs
async function initializePrograms() {
  const { CreatorProgram } = await import('./models/CreatorModels.js');

  const defaultPrograms = [
    {
      name: 'Top Koramangala Food Scout',
      description: 'Recognized food expert in Koramangala area',
      type: 'food_scout',
      requirements: { minFollowers: 100, minPosts: 20, minTrustScore: 50, requiredBadges: ['Food Scout'] },
      benefits: { coins: 500, badges: ['Top Food Scout'], features: ['featured_slot', 'early_access'], priority: 10 },
    },
    {
      name: 'Whitefield Safety Guardian',
      description: 'Trusted safety reporter in Whitefield',
      type: 'safety_guardian',
      requirements: { minFollowers: 50, minPosts: 10, minTrustScore: 100, requiredBadges: ['Safety Hero'] },
      benefits: { coins: 300, badges: ['Safety Guardian'], features: ['safety_alerts_priority'], priority: 15 },
    },
    {
      name: 'Indiranagar Event Ambassador',
      description: 'Event expert in Indiranagar area',
      type: 'event_ambassador',
      requirements: { minFollowers: 75, minPosts: 15, minTrustScore: 50, requiredBadges: ['Event Hunter'] },
      benefits: { coins: 400, badges: ['Event Expert'], features: ['event_boost', 'early_access'], priority: 8 },
    },
    {
      name: 'Area Ambassador',
      description: 'Community leader for your neighborhood',
      type: 'area_ambassador',
      requirements: { minFollowers: 200, minPosts: 50, minTrustScore: 200, requiredBadges: ['Local Legend'] },
      benefits: { coins: 1000, badges: ['Area Ambassador', 'Community Leader'], features: ['featured_slot', 'creator_dashboard', 'analytics'], priority: 20 },
    },
  ];

  for (const program of defaultPrograms) {
    await CreatorProgram.findOneAndUpdate(
      { name: program.name },
      program,
      { upsert: true }
    );
  }
  console.log('Creator programs initialized');
}

// Start server
app.listen(PORT, () => {
  logger.info(
╔═══════════════════════════════════════════════════════════════╗
║       BuzzLocal Creator Service                      ║
║                                                       ║
║  Port: ${PORT}                                           ║
║                                                       ║
║  Creator Roles:                                       ║
║  • Food Scout                                        ║
║  • Nightlife Expert                                  ║
║  • Safety Guardian                                   ║
║  • Event Ambassador                                  ║
║  • Community Leader                                 ║
║  • Deal Hunter                                       ║
║  • Trust Advocate                                   ║
║  • Area Ambassador                                  ║
║                                                       ║
║  Tiers:                                              ║
║  • Rising → Local → Expert → Authority              ║
║                                                       ║
║  Integrates with:                                    ║
║  • buzzlocal-feed-service (content)                 ║
║  • buzzlocal-trust-service (trust scores)            ║
║  • buzzlocal-wallet-service (earnings)               ║
║  • REZ Media (amplification)                         ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);

  initializePrograms().catch(console.error);
});

export { app };
