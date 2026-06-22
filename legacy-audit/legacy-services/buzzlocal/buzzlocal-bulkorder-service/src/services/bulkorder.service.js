/**
 * Bulk Order Service
 * FreshMart 4PM Story: "Apartment society needs 200 milk packets → NeighborAI discovers → FreshMart fulfills"
 */

const { BulkOrderRequest, BulkOrderParticipant, BulkOrderNotification } = require('../models/bulkorder.model');

class BulkOrderService {
  /**
   * Create bulk order request
   * FreshMart 4PM: Society initiates "We need 200 milk packets"
   */
  async createRequest(data) {
    const request_id = `BO-${Date.now().toString(36).toUpperCase()}`;

    const request = new BulkOrderRequest({
      request_id,
      ...data,
      aggregation: {
        started_at: new Date(),
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        minimum_count: data.minimum_count || 5
      }
    });

    await request.save();
    return request;
  }

  /**
   * Join a bulk order
   * Neighbor adds their items to the bulk request
   */
  async joinBulkOrder(requestId, userId, items, userData = {}) {
    const request = await BulkOrderRequest.findOne({ request_id: requestId });
    if (!request) throw new Error('Bulk order not found');
    if (request.status !== 'collecting') throw new Error('Bulk order no longer accepting participants');

    // Check if user already joined
    let participant = await BulkOrderParticipant.findOne({ request_id: requestId, user_id: userId });
    if (participant) {
      participant.items = items;
      participant.status = 'joined';
      await participant.save();
    } else {
      participant = new BulkOrderParticipant({
        request_id: requestId,
        user_id: userId,
        user_name: userData.name,
        unit_number: userData.unitNumber,
        items
      });
      await participant.save();
    }

    // Update request
    request.aggregation.current_count += 1;
    await request.save();

    // Update confirmed quantities
    await this.updateConfirmedQuantities(requestId);

    return { request, participant };
  }

  /**
   * Update confirmed quantities based on all participants
   */
  async updateConfirmedQuantities(requestId) {
    const participants = await BulkOrderParticipant.find({ request_id: requestId });
    const request = await BulkOrderRequest.findOne({ request_id: requestId });

    // Aggregate quantities per SKU
    const quantities = {};
    for (const p of participants) {
      for (const item of p.items) {
        if (!quantities[item.sku]) {
          quantities[item.sku] = { quantity_confirmed: 0, name: item.name, unit: item.unit };
        }
        quantities[item.sku].quantity_confirmed += item.quantity;
      }
    }

    // Update request items
    for (const item of request.items) {
      if (quantities[item.sku]) {
        item.quantity_confirmed = quantities[item.sku].quantity_confirmed;
      }
    }

    await request.save();
    return request;
  }

  /**
   * Confirm bulk order and notify stores
   * FreshMart 4PM: NeighborAI discovers → FreshMart fulfills
   */
  async confirmBulkOrder(requestId) {
    const request = await BulkOrderRequest.findOne({ request_id: requestId });
    if (!request) throw new Error('Bulk order not found');

    // Check minimum threshold
    if (request.aggregation.current_count < request.aggregation.minimum_count) {
      throw new Error(`Minimum ${request.aggregation.minimum_count} participants required`);
    }

    request.status = 'confirmed';
    request.aggregation.status = 'confirmed';
    await request.save();

    // Create notification record
    await new BulkOrderNotification({
      request_id: requestId,
      notification_type: 'confirmed',
      channel: 'buzzlocal',
      message: `Bulk order confirmed! ${request.aggregation.current_count} households participating.`,
      recipient_count: request.aggregation.current_count
    }).save();

    // Find nearby stores that can fulfill
    const nearbyStores = await this.findNearbyStores(request.location.coordinates, request.items);

    return { request, nearbyStores };
  }

  /**
   * Find nearby stores that can fulfill the bulk order
   * FreshMart 4PM: NeighborAI discovers → FreshMart fulfills
   */
  async findNearbyStores(coordinates, items) {
    // In production, call REZ-Mart or Nexha to find stores
    // For now, simulate finding stores
    const stores = [
      {
        store_id: 'freshmart-hsr',
        name: 'FreshMart',
        distance: '0.5 km',
        rating: 4.8,
        can_fulfill: true,
        delivery_available: true,
        bulk_pricing: {
          available: true,
          discount: '5-15%'
        }
      }
    ];

    return stores;
  }

  /**
   * Process bulk order and create store fulfillment
   * FreshMart 4PM: FreshMart receives bulk order → Prepares delivery
   */
  async fulfillBulkOrder(requestId, storeId, deliveryInfo = {}) {
    const request = await BulkOrderRequest.findOne({ request_id: requestId });
    if (!request) throw new Error('Bulk order not found');

    request.fulfillment = {
      ...request.fulfillment,
      store_id: storeId,
      estimated_delivery: deliveryInfo.estimatedDelivery || new Date(Date.now() + 24 * 60 * 60 * 1000),
      delivery_address: deliveryInfo.address || request.location.address,
      delivery_slot: deliveryInfo.slot || 'morning'
    };

    request.status = 'preparing';
    await request.save();

    // Notify all participants
    const participants = await BulkOrderParticipant.find({ request_id: requestId });
    await new BulkOrderNotification({
      request_id: requestId,
      notification_type: 'confirmed',
      channel: 'push',
      message: `Your bulk order will be delivered by FreshMart!`,
      recipient_count: participants.length
    }).save();

    return request;
  }

  /**
   * Get bulk orders for a neighborhood
   * FreshMart 4PM: NeighborAI discovers community needs
   */
  async getNeighborhoodBulkOrders(neighborhood, options = {}) {
    const { status = 'collecting', category, limit = 20 } = options;

    const filter = {
      'location.neighborhood': neighborhood,
      status
    };

    if (category) {
      filter['items.category'] = category;
    }

    return BulkOrderRequest.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  /**
   * Get bulk orders for a store
   * FreshMart: Store sees incoming bulk orders
   */
  async getBulkOrdersForStore(storeId, options = {}) {
    const { status, limit = 50 } = options;

    const filter = { 'fulfillment.store_id': storeId };
    if (status) filter.status = status;

    return BulkOrderRequest.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  /**
   * Get bulk order analytics
   */
  async getAnalytics(startDate, endDate) {
    const match = {
      createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
    };

    const [totalOrders, confirmedOrders, totalParticipants] = await Promise.all([
      BulkOrderRequest.countDocuments(match),
      BulkOrderRequest.countDocuments({ ...match, status: 'confirmed' }),
      BulkOrderParticipant.countDocuments({
        joined_at: { $gte: new Date(startDate), $lte: new Date(endDate) }
      })
    ]);

    // Category breakdown
    const categoryBreakdown = await BulkOrderRequest.aggregate([
      { $match: match },
      { $unwind: '$items' },
      { $group: { _id: '$items.category', count: { $sum: '$items.quantity_confirmed' } } }
    ]);

    return {
      totalOrders,
      confirmedOrders,
      confirmationRate: totalOrders > 0 ? (confirmedOrders / totalOrders * 100).toFixed(1) + '%' : '0%',
      totalParticipants,
      avgParticipantsPerOrder: totalOrders > 0 ? (totalParticipants / totalOrders).toFixed(1) : '0',
      categoryBreakdown
    };
  }

  /**
   * Cancel bulk order
   */
  async cancelBulkOrder(requestId, reason = 'Cancelled by requester') {
    const request = await BulkOrderRequest.findOneAndUpdate(
      { request_id: requestId },
      { status: 'cancelled' },
      { new: true }
    );

    // Refund participants
    await BulkOrderParticipant.updateMany(
      { request_id: requestId, payment_status: 'paid' },
      { payment_status: 'refunded', status: 'cancelled', cancelled_at: new Date() }
    );

    await new BulkOrderNotification({
      request_id: requestId,
      notification_type: 'cancelled',
      channel: 'buzzlocal',
      message: `Bulk order cancelled: ${reason}`,
      recipient_count: request.aggregation.current_count
    }).save();

    return request;
  }
}

module.exports = new BulkOrderService();
