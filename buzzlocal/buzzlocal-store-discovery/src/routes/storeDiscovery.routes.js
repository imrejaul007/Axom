/**
 * Store Discovery Routes
 */

const express = require('express');
const router = express.Router();
const discoveryService = require('../services/storeDiscovery.service');

/**
 * POST /api/discovery/stores
 * Discover stores near a location
 */
router.post('/stores', async (req, res) => {
  try {
    const result = await discoveryService.discoverStores(req.body);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/discovery/stores/nearby
 * Get nearby stores
 */
router.get('/stores/nearby', async (req, res) => {
  try {
    const { lat, lng, category = 'grocery', limit = 10 } = req.query;
    const stores = await discoveryService.getRecommendations({ lat, lng, category, limit: parseInt(limit) });
    res.json({ success: true, stores, count: stores.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/discovery/stores/select
 * Record store selection
 */
router.post('/stores/select', async (req, res) => {
  try {
    const { discoveryId, storeId, reason } = req.body;
    const result = await discoveryService.selectStore(discoveryId, storeId, reason);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/discovery/stores/register
 * Register a new store
 */
router.post('/stores/register', async (req, res) => {
  try {
    const store = await discoveryService.registerStore(req.body);
    res.json({ success: true, store });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/discovery/stores/:storeId/scores
 * Update store scores
 */
router.patch('/stores/:storeId/scores', async (req, res) => {
  try {
    const store = await discoveryService.updateScores(req.params.storeId, req.body);
    res.json({ success: true, store });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/discovery/neighborhood/:name/analytics
 * Get neighborhood analytics
 */
router.get('/neighborhood/:name/analytics', async (req, res) => {
  try {
    const analytics = await discoveryService.getNeighborhoodAnalytics(req.params.name);
    res.json({ success: true, analytics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
