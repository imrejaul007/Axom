/**
 * Bulk Order Routes
 * FreshMart 4PM Story: Community Commerce
 */

const express = require('express');
const router = express.Router();
const bulkOrderService = require('../services/bulkorder.service');

/**
 * POST /api/bulkorder/create
 * Create a new bulk order request
 * FreshMart: "Apartment society needs 200 milk packets"
 */
router.post('/create', async (req, res) => {
  try {
    const request = await bulkOrderService.createRequest(req.body);

    res.json({
      success: true,
      request_id: request.request_id,
      message: 'Bulk order created',
      aggregation: request.aggregation
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/bulkorder/:requestId/join
 * Join a bulk order
 */
router.post('/:requestId/join', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { userId, items, name, unitNumber } = req.body;

    const result = await bulkOrderService.joinBulkOrder(requestId, userId, items, { name, unitNumber });

    res.json({
      success: true,
      message: 'Joined bulk order',
      request: result.request,
      participant: result.participant
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/bulkorder/:requestId/confirm
 * Confirm bulk order (minimum participants reached)
 */
router.post('/:requestId/confirm', async (req, res) => {
  try {
    const { requestId } = req.params;
    const result = await bulkOrderService.confirmBulkOrder(requestId);

    res.json({
      success: true,
      message: 'Bulk order confirmed',
      request: result.request,
      nearbyStores: result.nearbyStores
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/bulkorder/:requestId/fulfill
 * Assign store and start fulfillment
 */
router.post('/:requestId/fulfill', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { storeId, deliveryInfo } = req.body;

    const request = await bulkOrderService.fulfillBulkOrder(requestId, storeId, deliveryInfo);

    res.json({
      success: true,
      message: 'Bulk order assigned for fulfillment',
      request
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/bulkorder/neighborhood/:neighborhood
 * Get bulk orders in a neighborhood
 * FreshMart 4PM: NeighborAI discovers community needs
 */
router.get('/neighborhood/:neighborhood', async (req, res) => {
  try {
    const { neighborhood } = req.params;
    const { status = 'collecting', category } = req.query;

    const orders = await bulkOrderService.getNeighborhoodBulkOrders(neighborhood, { status, category });

    res.json({
      success: true,
      neighborhood,
      orders,
      summary: {
        total: orders.length,
        active: orders.filter(o => o.status === 'collecting').length,
        confirmed: orders.filter(o => o.status === 'confirmed').length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/bulkorder/store/:storeId
 * Get bulk orders for a store
 */
router.get('/store/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;
    const { status } = req.query;

    const orders = await bulkOrderService.getBulkOrdersForStore(storeId, { status });

    res.json({
      success: true,
      storeId,
      orders
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/bulkorder/:requestId
 * Get bulk order details
 */
router.get('/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { BulkOrderRequest, BulkOrderParticipant } = require('../models/bulkorder.model');

    const request = await BulkOrderRequest.findOne({ request_id: requestId });
    const participants = await BulkOrderParticipant.find({ request_id: requestId });

    res.json({
      success: true,
      request,
      participants: participants.length,
      items_summary: request?.items?.map(i => ({
        sku: i.sku,
        name: i.name,
        quantity_requested: i.quantity_requested,
        quantity_confirmed: i.quantity_confirmed
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/bulkorder/:requestId
 * Cancel bulk order
 */
router.delete('/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;

    const request = await bulkOrderService.cancelBulkOrder(requestId, reason);

    res.json({
      success: true,
      message: 'Bulk order cancelled',
      request
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/bulkorder/analytics
 * Get analytics
 */
router.get('/analytics/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const analytics = await bulkOrderService.getAnalytics(start, end);

    res.json({
      success: true,
      period: { start: start.toISOString(), end: end.toISOString() },
      analytics
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
