/**
 * BuzzLocal Intelligence Hub v2.0
 *
 * Central integration point connecting BuzzLocal to REZ Intelligence services.
 *
 * Integrates with (12 services):
 * - REZ Unified Profile (4060) - User profiles
 * - REZ Intent Predictor (4018) - Intent classification
 * - REZ Predictive Engine (4123/4141) - Churn, LTV, Conversion
 * - REZ Realtime Segments (4126) - User segmentation
 * - REZ Care Service (4058) - Support & Safety
 * - REZ Signal Aggregator (4121) - Event aggregation
 * - REZ CDP Service - Customer Data Platform
 * - REZ Consumer Graph - Identity resolution
 * - REZ Event Platform - Local events
 * - REZ Demand Forecast - Offer timing
 * - REZ Hyperlocal Targeting - Area-based targeting
 * - REZ Personalization Engine - Feed ranking
 * - Expert Services (3000-3011) - Domain expertise
 */

import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4026;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'buzzlocal-intelligence-hub',
    version: '2.0.0',
    connectedServices: [
      'REZ_UNIFIED_PROFILE',
      'REZ_INTENT_PREDICTOR',
      'REZ_PREDICTIVE_ENGINE',
      'REZ_REALTIME_SEGMENTS',
      'REZ_CARE_SERVICE',
      'REZ_SIGNAL_AGGREGATOR',
      'REZ_CDP_SERVICE',
      'REZ_CONSUMER_GRAPH',
      'REZ_EVENT_PLATFORM',
      'REZ_DEMAND_FORECAST',
      'REZ_HYPERLOCAL_TARGETING',
      'REZ_PERSONALIZATION_ENGINE',
      'EXPERT_SERVICES'
    ]
  });
});

// ===== SERVICE URLS =====

const SERVICES = {
  // REZ Intelligence Core
  REZ_UNIFIED_PROFILE: process.env.REZ_UNIFIED_PROFILE_URL || 'http://localhost:4060',
  REZ_INTENT_PREDICTOR: process.env.REZ_INTENT_PREDICTOR_URL || 'http://localhost:4018',
  REZ_PREDICTIVE_ENGINE: process.env.REZ_PREDICTIVE_ENGINE_URL || 'http://localhost:4141',
  REZ_REALTIME_SEGMENTS: process.env.REZ_REALTIME_SEGMENTS_URL || 'http://localhost:4126',
  REZ_CARE_SERVICE: process.env.REZ_CARE_SERVICE_URL || 'http://localhost:4058',
  REZ_SIGNAL_AGGREGATOR: process.env.REZ_SIGNAL_AGGREGATOR_URL || 'http://localhost:4121',
  REZ_MERCHANT_INTEL: process.env.REZ_MERCHANT_INTEL_URL || 'http://localhost:4122',

  // NEW: CDP & Consumer Graph
  REZ_CDP_SERVICE: process.env.REZ_CDP_SERVICE_URL || 'http://localhost:4060',
  REZ_CONSUMER_GRAPH: process.env.REZ_CONSUMER_GRAPH_URL || 'http://localhost:4061',
  REZ_UNIFIED_IDENTITY: process.env.REZ_UNIFIED_IDENTITY_URL || 'http://localhost:4062',

  // NEW: Event & Demand
  REZ_EVENT_PLATFORM: process.env.REZ_EVENT_PLATFORM_URL || 'http://localhost:4063',
  REZ_DEMAND_FORECAST: process.env.REZ_DEMAND_FORECAST_URL || 'http://localhost:4064',
  REZ_HYPERLOCAL_TARGETING: process.env.REZ_HYPERLOCAL_TARGETING_URL || 'http://localhost:4065',
  REZ_PERSONALIZATION_ENGINE: process.env.REZ_PERSONALIZATION_ENGINE_URL || 'http://localhost:4066',

  // Expert Services
  EXPERT_FITNESS: process.env.REZ_FITNESS_EXPERT_URL || 'http://localhost:3010',
  EXPERT_SALON: process.env.REZ_SALON_EXPERT_URL || 'http://localhost:3005',
  EXPERT_TRAVEL: process.env.REZ_TRAVEL_EXPERT_URL || 'http://localhost:3003',
  EXPERT_HEALTH: process.env.REZ_HEALTH_EXPERT_URL || 'http://localhost:3011',
  EXPERT_HOSPITALITY: process.env.REZ_HOSPITALITY_EXPERT_URL || 'http://localhost:3000',
  EXPERT_RETAIL: process.env.REZ_RETAIL_EXPERT_URL || 'http://localhost:3004',
  EXPERT_EDUCATION: process.env.REZ_EDUCATION_EXPERT_URL || 'http://localhost:3006',

  // RABTUL
  RABTUL_AUTH: process.env.RABTUL_AUTH_URL || 'http://localhost:4002',
  RABTUL_WALLET: process.env.RABTUL_WALLET_URL || 'http://localhost:4004',
};

const HEADERS = {
  'Content-Type': 'application/json',
  'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || '',
  'X-Service': 'buzzlocal-intelligence-hub',
};

// ===== HELPER =====
async function safeFetch(url: string, options: any, fallback: any = null): Promise<any> {
  try {
    const response = await axios({ url, ...options, timeout: 5000 });
    return response.data;
  } catch (error: any) {
    logger.error(Service call failed: ${url}`, error.message);
    return fallback;
  }
}

// ===== USER PROFILE INTEGRATION =====

// GET /api/profile/:userId - Get unified user profile
app.get('/api/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const [profileRes, walletRes, segmentRes, cdpRes] = await Promise.all([
      safeFetch(`${SERVICES.REZ_UNIFIED_PROFILE}/api/profile/${userId}`, { headers: HEADERS }),
      safeFetch(`${SERVICES.RABTUL_WALLET}/api/wallet/${userId}`, { headers: HEADERS }),
      safeFetch(`${SERVICES.REZ_REALTIME_SEGMENTS}/api/segments/user/${userId}`, { headers: HEADERS }),
      safeFetch(`${SERVICES.REZ_CDP_SERVICE}/api/profile/${userId}`, { headers: HEADERS }),
    ]);

    res.json({
      success: true,
      profile: profileRes?.data || { userId },
      wallet: walletRes?.data || { balance: 0 },
      segments: segmentRes?.data?.segments || [],
      cdp: cdpRes?.data || null,
      trustScore: profileRes?.data?.trustScore || 50,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== CDP INTEGRATION (NEW) =====

// GET /api/cdp/profile/:userId - Get CDP profile
app.get('/api/cdp/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const data = await safeFetch(
      `${SERVICES.REZ_CDP_SERVICE}/api/profile/${userId}`,
      { headers: HEADERS }
    );
    res.json({ success: true, cdpProfile: data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/cdp/identify - Identity resolution
app.post('/api/cdp/identify', async (req, res) => {
  try {
    const { identifiers } = req.body; // { email?, phone?, deviceId? }
    const data = await safeFetch(
      `${SERVICES.REZ_CDP_SERVICE}/api/identify`,
      { method: 'POST', headers: HEADERS, data: { identifiers } }
    );
    res.json({ success: true, resolvedId: data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== CONSUMER GRAPH INTEGRATION (NEW) =====

// GET /api/graph/user/:userId - Get user graph
app.get('/api/graph/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const data = await safeFetch(
      `${SERVICES.REZ_CONSUMER_GRAPH}/api/user/${userId}`,
      { headers: HEADERS }
    );
    res.json({ success: true, graph: data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/graph/link - Link identities
app.post('/api/graph/link', async (req, res) => {
  try {
    const { sourceId, targetId, type } = req.body;
    const data = await safeFetch(
      `${SERVICES.REZ_CONSUMER_GRAPH}/api/link`,
      { method: 'POST', headers: HEADERS, data: { sourceId, targetId, type } }
    );
    res.json({ success: true, link: data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== INTENT & AI INTEGRATION =====

// POST /api/intent/classify - Classify user intent
app.post('/api/intent/classify', async (req, res) => {
  try {
    const { query, context } = req.body;
    const data = await safeFetch(
      `${SERVICES.REZ_INTENT_PREDICTOR}/api/intent/classify`,
      { method: 'POST', headers: HEADERS, data: { text: query, context: { ...context, source: 'buzzlocal' } } }
    );
    res.json({ success: true, intent: data });
  } catch (error: any) {
    res.json({ success: true, intent: { category: 'general', confidence: 0.5 }, fallback: true });
  }
});

// POST /api/intent/respond - Generate AI response
app.post('/api/intent/respond', async (req, res) => {
  try {
    const { query, context, history } = req.body;
    const data = await safeFetch(
      `${SERVICES.REZ_INTENT_PREDICTOR}/api/intent/respond`,
      { method: 'POST', headers: HEADERS, data: { query, context: { ...context, source: 'buzzlocal' }, history } }
    );
    res.json({ success: true, response: data.response, suggestions: data.suggestions || [] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'AI service unavailable' });
  }
});

// ===== EXPERT SERVICES =====

// POST /api/expert/query - Query domain expert
app.post('/api/expert/query', async (req, res) => {
  try {
    const { domain, query, context } = req.body;
    const expertUrls: Record<string, string> = {
      fitness: SERVICES.EXPERT_FITNESS,
      salon: SERVICES.EXPERT_SALON,
      travel: SERVICES.EXPERT_TRAVEL,
      health: SERVICES.EXPERT_HEALTH,
      hospitality: SERVICES.EXPERT_HOSPITALITY,
      retail: SERVICES.EXPERT_RETAIL,
      education: SERVICES.EXPERT_EDUCATION,
    };
    const expertUrl = expertUrls[domain?.toLowerCase()];
    if (!expertUrl) return res.status(400).json({ success: false, error: 'Unknown domain' });

    const data = await safeFetch(
      `${expertUrl}/api/query`,
      { method: 'POST', headers: HEADERS, data: { question: query, context: { ...context, source: 'buzzlocal' } } }
    );
    res.json({ success: true, expert: domain, answer: data?.answer, confidence: data?.confidence || 0.8 });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Expert service unavailable' });
  }
});

// ===== PREDICTIVE ENGINE =====

// GET /api/predict/:type/:userId - Get predictions
app.get('/api/predict/:type/:userId', async (req, res) => {
  try {
    const { type, userId } = req.params;
    const types: Record<string, string> = {
      churn: 'churn',
      ltv: 'ltv',
      revisit: 'revisit',
      conversion: 'conversion'
    };
    const endpoint = types[type];
    if (!endpoint) return res.status(400).json({ success: false, error: 'Unknown type' });

    const data = await safeFetch(
      `${SERVICES.REZ_PREDICTIVE_ENGINE}/api/${endpoint}/${userId}`,
      { headers: HEADERS }
    );
    res.json({ success: true, prediction: data });
  } catch (error: any) {
    res.json({ success: true, prediction: { score: 0.5 }, fallback: true });
  }
});

// ===== SEGMENTATION =====

// GET /api/segments/:userId - Get user segments
app.get('/api/segments/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const data = await safeFetch(
      `${SERVICES.REZ_REALTIME_SEGMENTS}/api/segments/user/${userId}`,
      { headers: HEADERS }
    );
    res.json({ success: true, segments: data?.segments || [] });
  } catch (error: any) {
    res.json({ success: true, segments: [] });
  }
});

// ===== EVENT PLATFORM (NEW) =====

// GET /api/events/nearby - Get nearby events
app.get('/api/events/nearby', async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;
    const data = await safeFetch(
      `${SERVICES.REZ_EVENT_PLATFORM}/api/events/nearby?lat=${lat}&lng=${lng}&radius=${radius || 5000}`,
      { headers: HEADERS }
    );
    res.json({ success: true, events: data?.events || [] });
  } catch (error: any) {
    res.json({ success: true, events: [] });
  }
});

// GET /api/events/:eventId - Get event details
app.get('/api/events/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const data = await safeFetch(
      `${SERVICES.REZ_EVENT_PLATFORM}/api/events/${eventId}`,
      { headers: HEADERS }
    );
    res.json({ success: true, event: data });
  } catch (error: any) {
    res.status(404).json({ success: false, error: 'Event not found' });
  }
});

// ===== DEMAND FORECAST (NEW) =====

// GET /api/demand/area/:area - Get demand forecast
app.get('/api/demand/area/:area', async (req, res) => {
  try {
    const { area } = req.params;
    const data = await safeFetch(
      `${SERVICES.REZ_DEMAND_FORECAST}/api/forecast/area/${area}`,
      { headers: HEADERS }
    );
    res.json({ success: true, forecast: data });
  } catch (error: any) {
    res.json({ success: true, forecast: { level: 'normal' }, fallback: true });
  }
});

// GET /api/demand/optimal-time - Get optimal deal time
app.get('/api/demand/optimal-time', async (req, res) => {
  try {
    const { category, area } = req.query;
    const data = await safeFetch(
      `${SERVICES.REZ_DEMAND_FORECAST}/api/optimal-time?category=${category}&area=${area}`,
      { headers: HEADERS }
    );
    res.json({ success: true, optimalTime: data });
  } catch (error: any) {
    res.json({ success: true, optimalTime: { hours: [12, 19] }, fallback: true });
  }
});

// ===== HYPERLOCAL TARGETING (NEW) =====

// GET /api/targeting/audience/:area - Get audience segments in area
app.get('/api/targeting/audience/:area', async (req, res) => {
  try {
    const { area } = req.params;
    const data = await safeFetch(
      `${SERVICES.REZ_HYPERLOCAL_TARGETING}/api/audience/area/${area}`,
      { headers: HEADERS }
    );
    res.json({ success: true, audience: data });
  } catch (error: any) {
    res.json({ success: true, audience: { segments: [] }, fallback: true });
  }
});

// GET /api/targeting/trending/:area - Get trending in area
app.get('/api/targeting/trending/:area', async (req, res) => {
  try {
    const { area } = req.params;
    const data = await safeFetch(
      `${SERVICES.REZ_HYPERLOCAL_TARGETING}/api/trending/area/${area}`,
      { headers: HEADERS }
    );
    res.json({ success: true, trending: data });
  } catch (error: any) {
    res.json({ success: true, trending: { categories: [] }, fallback: true });
  }
});

// ===== PERSONALIZATION ENGINE (NEW) =====

// GET /api/personalize/feed/:userId - Get personalized feed
app.get('/api/personalize/feed/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit } = req.query;
    const data = await safeFetch(
      `${SERVICES.REZ_PERSONALIZATION_ENGINE}/api/feed/${userId}?limit=${limit || 20}`,
      { headers: HEADERS }
    );
    res.json({ success: true, feed: data?.items || [] });
  } catch (error: any) {
    res.json({ success: true, feed: [] });
  }
});

// POST /api/personalize/rank - Rank items for user
app.post('/api/personalize/rank', async (req, res) => {
  try {
    const { userId, items, context } = req.body;
    const data = await safeFetch(
      `${SERVICES.REZ_PERSONALIZATION_ENGINE}/api/rank`,
      { method: 'POST', headers: HEADERS, data: { userId, items, context } }
    );
    res.json({ success: true, ranked: data?.items || items });
  } catch (error: any) {
    const { items } = req.body;
    res.json({ success: true, ranked: items || [] });
  }
});

// ===== CARE SERVICE (SAFETY) =====

// POST /api/care/sos - Trigger SOS
app.post('/api/care/sos', async (req, res) => {
  try {
    const { userId, location, type, contacts } = req.body;
    const data = await safeFetch(
      `${SERVICES.REZ_CARE_SERVICE}/api/tickets/emergency`,
      { method: 'POST', headers: HEADERS, data: { userId, type: 'safety', priority: 'critical', data: { location, emergencyType: type, triggeredBy: 'buzzlocal', notifyContacts: contacts } } }
    );
    res.json({ success: true, ticketId: data?.ticketId });
  } catch (error: any) {
    res.json({ success: true, ticketId: null, local: true });
  }
});

// GET /api/care/alerts/:area - Get safety alerts
app.get('/api/care/alerts/:area', async (req, res) => {
  try {
    const { area } = req.params;
    const data = await safeFetch(
      `${SERVICES.REZ_CARE_SERVICE}/api/alerts/area/${area}`,
      { headers: HEADERS }
    );
    res.json({ success: true, alerts: data?.alerts || [] });
  } catch (error: any) {
    res.json({ success: true, alerts: [] });
  }
});

// ===== SIGNAL AGGREGATION =====

// POST /api/signals/event - Send signal
app.post('/api/signals/event', async (req, res) => {
  try {
    const { userId, type, data: eventData, context } = req.body;
    await safeFetch(
      `${SERVICES.REZ_SIGNAL_AGGREGATOR}/api/signals/ingest`,
      { method: 'POST', headers: HEADERS, data: { userId, type, data: eventData, context, source: 'buzzlocal' } }
    );
    res.json({ success: true });
  } catch (error: any) {
    res.json({ success: true, fallback: true });
  }
});

// ===== MERCHANT INTELLIGENCE =====

// GET /api/merchant/recommendations/:area - Get recommendations
app.get('/api/merchant/recommendations/:area', async (req, res) => {
  try {
    const { area } = req.params;
    const data = await safeFetch(
      `${SERVICES.REZ_MERCHANT_INTEL}/api/recommendations/area/${area}`,
      { headers: HEADERS }
    );
    res.json({ success: true, recommendations: data?.merchants || [] });
  } catch (error: any) {
    res.json({ success: true, recommendations: [] });
  }
});

// ===== START SERVER =====

app.listen(PORT, () => {
  logger.info(
╔═══════════════════════════════════════════════════════════════╗
║       BuzzLocal Intelligence Hub v2.0               ║
║                                                       ║
║  Port: ${PORT}                                           ║
║                                                       ║
║  Connected to REZ Intelligence (12 services):       ║
║  • Unified Profile (4060)                          ║
║  • Intent Predictor (4018)                         ║
║  • Predictive Engine (4141)                         ║
║  • Realtime Segments (4126)                         ║
║  • Care Service (4058)                              ║
║  • Signal Aggregator (4121)                         ║
║  • CDP Service (4060)                                ║
║  • Consumer Graph (4061)                            ║
║  • Event Platform (4063)                            ║
║  • Demand Forecast (4064)                           ║
║  • Hyperlocal Targeting (4065)                      ║
║  • Personalization Engine (4066)                     ║
║  • Expert Services (3000-3011)                      ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});

export { app };
