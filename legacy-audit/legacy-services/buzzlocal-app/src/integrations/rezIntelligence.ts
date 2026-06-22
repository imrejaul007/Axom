/**
 * BuzzLocal → REZ Intelligence Integration
 *
 * Bidirectional data flow:
 * - BuzzLocal sends behavioral data TO REZ Intelligence
 * - BuzzLocal receives AI predictions FROM REZ Intelligence
 */

import axios from 'axios';

const HUB_URL = process.env.BUZZLOCAL_HUB_URL || 'http://localhost:4026';
const COLLECTOR_URL = process.env.BUZZLOCAL_COLLECTOR_URL || 'http://localhost:4027';
const TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

const HEADERS = {
  'Content-Type': 'application/json',
  'X-Internal-Token': TOKEN,
  'X-Source': 'buzzlocal',
};

// ===== INTELLIGENCE HUB (Receiving Predictions) =====

export const rezIntelligence = {
  // User Profile
  async getProfile(userId: string) {
    const { data } = await axios.get(`${HUB_URL}/api/profile/${userId}`, { headers: HEADERS });
    return data;
  },

  // CDP Profile
  async getCDPProfile(userId: string) {
    const { data } = await axios.get(`${HUB_URL}/api/cdp/profile/${userId}`, { headers: HEADERS });
    return data;
  },

  // Identity Resolution
  async identifyUser(identifiers: { email?: string; phone?: string; deviceId?: string }) {
    const { data } = await axios.post(`${HUB_URL}/api/cdp/identify`, { identifiers }, { headers: HEADERS });
    return data;
  },

  // Consumer Graph
  async getUserGraph(userId: string) {
    const { data } = await axios.get(`${HUB_URL}/api/graph/user/${userId}`, { headers: HEADERS });
    return data;
  },

  // Intent Classification
  async classifyIntent(query: string, context?: Record<string, unknown>) {
    const { data } = await axios.post(`${HUB_URL}/api/intent/classify`, { query, context }, { headers: HEADERS });
    return data;
  },

  // AI Response (Ask Buzz)
  async askBuzz(query: string, context?: Record<string, unknown>, history?: unknown[]) {
    const { data } = await axios.post(`${HUB_URL}/api/intent/respond`, { query, context, history }, { headers: HEADERS });
    return data;
  },

  // Expert Services
  async queryExpert(domain: string, query: string, context?: Record<string, unknown>) {
    const { data } = await axios.post(`${HUB_URL}/api/expert/query`, { domain, query, context }, { headers: HEADERS });
    return data;
  },

  // Predictions
  async getPrediction(type: 'churn' | 'ltv' | 'revisit' | 'conversion', userId: string) {
    const { data } = await axios.get(`${HUB_URL}/api/predict/${type}/${userId}`, { headers: HEADERS });
    return data;
  },

  // User Segments
  async getSegments(userId: string) {
    const { data } = await axios.get(`${HUB_URL}/api/segments/${userId}`, { headers: HEADERS });
    return data;
  },

  // Nearby Events
  async getNearbyEvents(lat: number, lng: number, radius = 5000) {
    const { data } = await axios.get(`${HUB_URL}/api/events/nearby?lat=${lat}&lng=${lng}&radius=${radius}`, { headers: HEADERS });
    return data;
  },

  // Demand Forecast
  async getDemandForecast(area: string) {
    const { data } = await axios.get(`${HUB_URL}/api/demand/area/${area}`, { headers: HEADERS });
    return data;
  },

  // Optimal Deal Time
  async getOptimalTime(category?: string, area?: string) {
    const { data } = await axios.get(`${HUB_URL}/api/demand/optimal-time?category=${category || ''}&area=${area || ''}`, { headers: HEADERS });
    return data;
  },

  // Hyperlocal Audience
  async getAudienceSegments(area: string) {
    const { data } = await axios.get(`${HUB_URL}/api/targeting/audience/${area}`, { headers: HEADERS });
    return data;
  },

  // Trending in Area
  async getTrending(area: string) {
    const { data } = await axios.get(`${HUB_URL}/api/targeting/trending/${area}`, { headers: HEADERS });
    return data;
  },

  // Personalized Feed
  async getPersonalizedFeed(userId: string, limit = 20) {
    const { data } = await axios.get(`${HUB_URL}/api/personalize/feed/${userId}?limit=${limit}`, { headers: HEADERS });
    return data;
  },

  // Rank Items
  async rankItems(userId: string, items: unknown[], context?: Record<string, unknown>) {
    const { data } = await axios.post(`${HUB_URL}/api/personalize/rank`, { userId, items, context }, { headers: HEADERS });
    return data;
  },

  // Safety Alerts
  async getSafetyAlerts(area: string) {
    const { data } = await axios.get(`${HUB_URL}/api/care/alerts/${area}`, { headers: HEADERS });
    return data;
  },

  // Merchant Recommendations
  async getMerchantRecommendations(area: string) {
    const { data } = await axios.get(`${HUB_URL}/api/merchant/recommendations/${area}`, { headers: HEADERS });
    return data;
  },
};

// ===== DATA COLLECTOR (Sending Signals) =====

export const rezDataCollector = {
  // User Action
  async sendAction(userId: string, actionType: string, context?: Record<string, unknown>, metadata?: Record<string, unknown>) {
    const { data } = await axios.post(`${COLLECTOR_URL}/api/signals/action`, { userId, actionType, context, metadata }, { headers: HEADERS });
    return data;
  },

  // Intent Signal (Ask Buzz feedback)
  async sendIntent(userId: string, query: string, intent: string, entities?: Record<string, unknown>, responseType?: string, satisfied?: boolean) {
    const { data } = await axios.post(`${COLLECTOR_URL}/api/signals/intent`, { userId, query, intent, entities, responseType, satisfied }, { headers: HEADERS });
    return data;
  },

  // Safety Signal
  async sendSafety(userId: string, type: 'alert' | 'sos' | 'checkin' | 'route', location: { lat: number; lng: number; area: string }, context?: Record<string, unknown>) {
    const { data } = await axios.post(`${COLLECTOR_URL}/api/signals/safety`, { userId, type, location, context }, { headers: HEADERS });
    return data;
  },

  // SOS
  async sendSOS(userId: string, location: { lat: number; lng: number; area: string }, emergencyType?: string, contacts?: string[]) {
    const { data } = await axios.post(`${HUB_URL}/api/care/sos`, { userId, location, type: emergencyType, contacts }, { headers: HEADERS });
    return data;
  },

  // Commerce Signal
  async sendCommerce(userId: string, type: 'view' | 'search' | 'interaction' | 'conversion', entityType: string, entityId: string, metadata?: Record<string, unknown>) {
    const { data } = await axios.post(`${COLLECTOR_URL}/api/signals/commerce`, { userId, type, entityType, entityId, metadata }, { headers: HEADERS });
    return data;
  },

  // Check-in
  async sendCheckin(userId: string, location: { lat: number; lng: number }, area: string, placeType?: string) {
    const { data } = await axios.post(`${COLLECTOR_URL}/api/signals/checkin`, { userId, location, area, placeType }, { headers: HEADERS });
    return data;
  },

  // Search Signal
  async sendSearch(userId: string, query: string, filters?: Record<string, unknown>, resultsShown?: number, clickedResult?: string) {
    const { data } = await axios.post(`${COLLECTOR_URL}/api/signals/search`, { userId, query, filters, resultsShown, clickedResult }, { headers: HEADERS });
    return data;
  },

  // Batch Signals
  async sendBatch(signals: unknown[]) {
    const { data } = await axios.post(`${COLLECTOR_URL}/api/signals/batch`, { signals }, { headers: HEADERS });
    return data;
  },
};

export default { rezIntelligence, rezDataCollector };
