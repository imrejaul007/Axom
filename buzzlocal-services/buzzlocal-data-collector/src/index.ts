/**
 * BuzzLocal Data Collector v2.0
 *
 * Collects and sends user behavior data to REZ Intelligence for:
 * - Intent model training
 * - User segmentation
 * - Churn prediction
 * - Recommendations
 * - Pattern recognition
 * - CDP profile updates
 * - Consumer graph linking
 * - Event engagement
 * - Hyperlocal targeting
 *
 * Data Flow:
 * BuzzLocal User Actions → Data Collector → REZ Signal Aggregator → AI Models → Improved Predictions
 */

import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4027;

app.use(cors());
app.use(express.json());

// ===== SERVICE URLS =====

const SERVICES = {
  // REZ Signal Aggregator - receives all signals
  SIGNAL_AGGREGATOR: process.env.REZ_SIGNAL_AGGREGATOR_URL || 'http://localhost:4121',

  // REZ Intent Graph - intent tracking
  INTENT_GRAPH: process.env.REZ_INTENT_GRAPH_URL || 'http://localhost:4050',

  // REZ Realtime Segments - segmentation updates
  REALTIME_SEGMENTS: process.env.REZ_REALTIME_SEGMENTS_URL || 'http://localhost:4126',

  // REZ Predictive Engine - for model training
  PREDICTIVE_ENGINE: process.env.REZ_PREDICTIVE_ENGINE_URL || 'http://localhost:4141',

  // REZ Unified Profile - profile updates
  UNIFIED_PROFILE: process.env.REZ_UNIFIED_PROFILE_URL || 'http://localhost:4060',

  // REZ Care Service - for safety signals
  CARE_SERVICE: process.env.REZ_CARE_SERVICE_URL || 'http://localhost:4058',

  // NEW: CDP & Consumer Graph
  CDP_SERVICE: process.env.REZ_CDP_SERVICE_URL || 'http://localhost:4060',
  CONSUMER_GRAPH: process.env.REZ_CONSUMER_GRAPH_URL || 'http://localhost:4061',

  // NEW: Event Platform
  EVENT_PLATFORM: process.env.REZ_EVENT_PLATFORM_URL || 'http://localhost:4063',

  // NEW: Hyperlocal Targeting
  HYPERLOCAL: process.env.REZ_HYPERLOCAL_TARGETING_URL || 'http://localhost:4065',

  // NEW: Personalization
  PERSONALIZATION: process.env.REZ_PERSONALIZATION_ENGINE_URL || 'http://localhost:4066',
};

const HEADERS = {
  'Content-Type': 'application/json',
  'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || '',
  'X-Source': 'buzzlocal',
  'X-Data-Type': 'behavioral',
};

// ===== DATA COLLECTION SCHEMA =====

interface UserAction {
  userId: string;
  actionType: string;
  timestamp: Date;
  context: {
    location?: { lat: number; lng: number; area: string };
    device?: string;
    sessionId?: string;
    persona?: string;
  };
  metadata: Record<string, any>;
}

interface IntentSignal {
  userId: string;
  query: string;
  intent: string;
  entities: Record<string, any>;
  responseType: string;
  satisfied: boolean;
  followUp: boolean;
  timestamp: Date;
}

interface SafetySignal {
  userId: string;
  type: 'alert' | 'sos' | 'checkin' | 'route';
  location: { lat: number; lng: number; area: string };
  context: Record<string, any>;
  timestamp: Date;
}

interface CommerceSignal {
  userId: string;
  type: 'view' | 'search' | 'interaction' | 'conversion';
  entityType: string;
  entityId: string;
  metadata: Record<string, any>;
  timestamp: Date;
}

// ===== DATA SENDING FUNCTIONS =====

async function sendToSignalAggregator(signal: any): Promise<boolean> {
  try {
    await axios.post(
      `${SERVICES.SIGNAL_AGGREGATOR}/api/signals/ingest`,
      signal,
      { headers: HEADERS, timeout: 3000 }
    );
    return true;
  } catch (error: any) {
    console.error('Signal send error:', error.message);
    return false;
  }
}

async function sendToIntentGraph(signal: IntentSignal): Promise<boolean> {
  try {
    await axios.post(
      `${SERVICES.INTENT_GRAPH}/api/intent/signals`,
      signal,
      { headers: HEADERS, timeout: 3000 }
    );
    return true;
  } catch (error: any) {
    console.error('Intent signal error:', error.message);
    return false;
  }
}

async function sendToSegments(signal: any): Promise<boolean> {
  try {
    await axios.post(
      `${SERVICES.REALTIME_SEGMENTS}/api/signals/behavioral`,
      signal,
      { headers: HEADERS, timeout: 3000 }
    );
    return true;
  } catch (error: any) {
    console.error('Segment signal error:', error.message);
    return false;
  }
}

// NEW: Send to CDP
async function sendToCDP(signal: any): Promise<boolean> {
  try {
    await axios.post(
      `${SERVICES.CDP_SERVICE}/api/activity`,
      signal,
      { headers: HEADERS, timeout: 3000 }
    );
    return true;
  } catch (error: any) {
    return false;
  }
}

// NEW: Send to Consumer Graph
async function sendToConsumerGraph(signal: any): Promise<boolean> {
  try {
    await axios.post(
      `${SERVICES.CONSUMER_GRAPH}/api/signals`,
      signal,
      { headers: HEADERS, timeout: 3000 }
    );
    return true;
  } catch (error: any) {
    return false;
  }
}

// NEW: Send to Event Platform
async function sendToEventPlatform(signal: any): Promise<boolean> {
  try {
    await axios.post(
      `${SERVICES.EVENT_PLATFORM}/api/signals`,
      signal,
      { headers: HEADERS, timeout: 3000 }
    );
    return true;
  } catch (error: any) {
    return false;
  }
}

// NEW: Send to Hyperlocal Targeting
async function sendToHyperlocal(signal: any): Promise<boolean> {
  try {
    await axios.post(
      `${SERVICES.HYPERLOCAL}/api/signals/engagement`,
      signal,
      { headers: HEADERS, timeout: 3000 }
    );
    return true;
  } catch (error: any) {
    return false;
  }
}

// NEW: Send to Personalization
async function sendToPersonalization(signal: any): Promise<boolean> {
  try {
    await axios.post(
      `${SERVICES.PERSONALIZATION}/api/signals/interaction`,
      signal,
      { headers: HEADERS, timeout: 3000 }
    );
    return true;
  } catch (error: any) {
    return false;
  }
}

// ===== API ENDPOINTS =====

// Health
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'buzzlocal-data-collector',
    version: '2.0.0',
    connectedTo: Object.keys(SERVICES),
  });
});

// ===== USER ACTION SIGNALS =====

// POST /api/signals/action - Log user action
app.post('/api/signals/action', async (req, res) => {
  try {
    const signal: UserAction = {
      userId: req.body.userId,
      actionType: req.body.actionType,
      timestamp: new Date(),
      context: req.body.context || {},
      metadata: req.body.metadata || {},
    };

    // Send to multiple services in parallel
    const results = await Promise.allSettled([
      sendToSignalAggregator({ ...signal, source: 'buzzlocal', category: 'user_action' }),
      sendToSegments({ userId: signal.userId, action: signal.actionType, context: signal.context, metadata: signal.metadata, timestamp: signal.timestamp }),
      sendToCDP({ userId: signal.userId, type: signal.actionType, context: signal.context, timestamp: signal.timestamp }),
      sendToConsumerGraph({ userId: signal.userId, action: signal.actionType, timestamp: signal.timestamp }),
      sendToHyperlocal({ userId: signal.userId, location: signal.context?.location, action: signal.actionType, timestamp: signal.timestamp }),
      sendToPersonalization({ userId: signal.userId, interaction: signal.actionType, context: signal.context, timestamp: signal.timestamp }),
    ]);

    res.json({
      success: true,
      signalId: `sig_${Date.now()}`,
      sentTo: results.filter(r => r.status === 'fulfilled').length,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== INTENT SIGNALS =====

// POST /api/signals/intent - Log Ask Buzz intent
app.post('/api/signals/intent', async (req, res) => {
  try {
    const signal: IntentSignal = {
      userId: req.body.userId,
      query: req.body.query,
      intent: req.body.intent,
      entities: req.body.entities || {},
      responseType: req.body.responseType,
      satisfied: req.body.satisfied || false,
      followUp: req.body.followUp || false,
      timestamp: new Date(),
    };

    // Send to intent graph for model training
    const results = await Promise.allSettled([
      sendToIntentGraph(signal),
      sendToSignalAggregator({ ...signal, source: 'buzzlocal', category: 'intent' }),
      sendToCDP({ userId: signal.userId, type: 'intent_query', intent: signal.intent, timestamp: signal.timestamp }),
      sendToPersonalization({ userId: signal.userId, query: signal.query, intent: signal.intent, timestamp: signal.timestamp }),
    ]);

    // If satisfied feedback, update training data
    if (signal.satisfied !== undefined) {
      await axios.post(
        `${SERVICES.INTENT_GRAPH}/api/intent/feedback`,
        { query: signal.query, intent: signal.intent, satisfied: signal.satisfied },
        { headers: HEADERS, timeout: 3000 }
      ).catch(() => {}); // Non-blocking
    }

    res.json({
      success: true,
      signalId: `intent_${Date.now()}`,
      sentTo: results.filter(r => r.status === 'fulfilled').length,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== SAFETY SIGNALS =====

// POST /api/signals/safety - Log safety event
app.post('/api/signals/safety', async (req, res) => {
  try {
    const signal: SafetySignal = {
      userId: req.body.userId,
      type: req.body.type,
      location: req.body.location,
      context: req.body.context || {},
      timestamp: new Date(),
    };

    // Send to care service and signal aggregator
    const results = await Promise.allSettled([
      sendToSignalAggregator({
        ...signal,
        source: 'buzzlocal',
        category: 'safety',
      }),
      axios.post(
        `${SERVICES.CARE_SERVICE}/api/signals/safety`,
        signal,
        { headers: HEADERS, timeout: 5000 }
      ).catch(() => {}), // Non-blocking for SOS
    ]);

    res.json({
      success: true,
      signalId: `safety_${Date.now()}`,
      priority: signal.type === 'sos' ? 'critical' : 'normal',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== COMMERCE SIGNALS =====

// POST /api/signals/commerce - Log commerce interaction
app.post('/api/signals/commerce', async (req, res) => {
  try {
    const signal: CommerceSignal = {
      userId: req.body.userId,
      type: req.body.type,
      entityType: req.body.entityType,
      entityId: req.body.entityId,
      metadata: req.body.metadata || {},
      timestamp: new Date(),
    };

    const results = await Promise.allSettled([
      sendToSignalAggregator({ ...signal, source: 'buzzlocal', category: 'commerce' }),
      sendToSegments({ userId: signal.userId, behavior: signal.type, entity: `${signal.entityType}:${signal.entityId}`, metadata: signal.metadata }),
      sendToCDP({ userId: signal.userId, type: 'commerce', entity: signal.entityType, timestamp: signal.timestamp }),
      sendToHyperlocal({ userId: signal.userId, location: signal.metadata?.location, action: signal.type, timestamp: signal.timestamp }),
      sendToPersonalization({ userId: signal.userId, interaction: signal.type, entity: signal.entityType, timestamp: signal.timestamp }),
    ]);

    res.json({
      success: true,
      signalId: `commerce_${Date.now()}`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== CHECK-IN SIGNALS =====

// POST /api/signals/checkin - Log check-in
app.post('/api/signals/checkin', async (req, res) => {
  try {
    const signal = {
      userId: req.body.userId,
      location: req.body.location,
      area: req.body.area,
      placeType: req.body.placeType,
      timestamp: new Date(),
      source: 'buzzlocal',
      category: 'presence',
    };

    await Promise.allSettled([
      sendToSignalAggregator(signal),
      sendToEventPlatform({ userId: signal.userId, location: signal.location, area: signal.area, type: 'checkin', timestamp: signal.timestamp }),
      sendToCDP({ userId: signal.userId, type: 'presence', location: signal.location, timestamp: signal.timestamp }),
      sendToHyperlocal({ userId: signal.userId, location: signal.location, area: signal.area, action: 'checkin', timestamp: signal.timestamp }),
      axios.post(`${SERVICES.SIGNAL_AGGREGATOR}/api/density/checkin`, signal, { headers: HEADERS, timeout: 3000 }),
    ]);

    res.json({
      success: true,
      signalId: `checkin_${Date.now()}`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== SEARCH SIGNALS =====

// POST /api/signals/search - Log search query
app.post('/api/signals/search', async (req, res) => {
  try {
    const signal = {
      userId: req.body.userId,
      query: req.body.query,
      filters: req.body.filters,
      resultsShown: req.body.resultsShown,
      clickedResult: req.body.clickedResult,
      timestamp: new Date(),
      source: 'buzzlocal',
      category: 'search',
    };

    await Promise.allSettled([
      sendToSignalAggregator(signal),
      sendToIntentGraph({
        userId: signal.userId,
        query: signal.query,
        intent: 'search',
        entities: signal.filters,
        responseType: 'search_results',
        satisfied: signal.clickedResult !== undefined,
        followUp: false,
        timestamp: signal.timestamp,
      }),
      sendToCDP({ userId: signal.userId, type: 'search', query: signal.query, timestamp: signal.timestamp }),
      sendToPersonalization({ userId: signal.userId, interaction: 'search', query: signal.query, timestamp: signal.timestamp }),
      sendToHyperlocal({ userId: signal.userId, query: signal.query, timestamp: signal.timestamp }),
    ]);

    res.json({
      success: true,
      signalId: `search_${Date.now()}`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== BATCH SIGNALS =====

// POST /api/signals/batch - Send batch of signals
app.post('/api/signals/batch', async (req, res) => {
  try {
    const signals = req.body.signals || [];

    const results = await Promise.allSettled(
      signals.map((signal: any) => sendToSignalAggregator({
        ...signal,
        source: 'buzzlocal',
        timestamp: new Date(),
      }))
    );

    const success = results.filter(r => r.status === 'fulfilled').length;

    res.json({
      success: true,
      total: signals.length,
      sent: success,
      failed: signals.length - success,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== START SERVER =====

app.listen(PORT, () => {
  logger.info(
╔═══════════════════════════════════════════════════════════════╗
║       BuzzLocal Data Collector                         ║
║                                                       ║
║  Port: ${PORT}                                           ║
║                                                       ║
║  Sending data to REZ Intelligence:                     ║
║  • Signal Aggregator (4121)                          ║
║  • Intent Graph (4050)                               ║
║  • Realtime Segments (4126)                          ║
║  • Predictive Engine (4123)                          ║
║  • Care Service (4055)                              ║
║  • Unified Profile (4120)                            ║
║                                                       ║
║  Collecting:                                           ║
║  • User actions                                       ║
║  • Intent queries                                     ║
║  • Safety events                                      ║
║  • Commerce interactions                              ║
║  • Check-ins                                          ║
║  • Searches                                           ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});

export { app };
