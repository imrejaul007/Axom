/**
 * Bulk Order Models
 * FreshMart 4PM Story: "Apartment society needs 200 milk packets → NeighborAI discovers → FreshMart fulfills"
 */

const mongoose = require('mongoose');

// ============================================================================
// Bulk Order Request
// A society or group requesting bulk items
// ============================================================================

const bulkOrderRequestSchema = new mongoose.Schema({
  // Request info
  request_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  requester_type: {
    type: String,
    enum: ['society', 'apartment', 'office', 'hostel', 'group'],
    required: true
  },
  requester_id: {
    type: String,
    required: true,
    index: true
  },
  requester_name: {
    type: String,
    required: true
  },
  location: {
    address: String,
    coordinates: {
      lat: Number,
      lng: Number
    },
    neighborhood: String
  },

  // Items requested
  items: [{
    sku: String,
    name: String,
    category: String,
    quantity_requested: Number,
    quantity_confirmed: {
      type: Number,
      default: 0
    },
    unit: String,
    preferred_brand: String
  }],

  // Aggregation info
  aggregation: {
    started_at: Date,
    deadline: Date,
    current_count: {
      type: Number,
      default: 1
    },
    minimum_count: {
      type: Number,
      default: 5
    },
    maximum_count: Number,
    status: {
      type: String,
      enum: ['collecting', 'confirmed', 'cancelled'],
      default: 'collecting'
    }
  },

  // Fulfillment
  fulfillment: {
    preferred_store: String,
    store_id: String,
    estimated_delivery: Date,
    delivery_address: String,
    delivery_slot: String,
    delivery_type: {
      type: String,
      enum: ['pickup', 'delivery', 'scheduled'],
      default: 'delivery'
    },
    pooled_delivery: {
      enabled: Boolean,
      shared_cost: Number,
      participants: Number
    }
  },

  // Pricing
  pricing: {
    regular_price: Number,
    bulk_discount: {
      percentage: Number,
      type: String  // 'automatic' | 'negotiated'
    },
    final_price: Number,
    per_person_cost: Number
  },

  // Status
  status: {
    type: String,
    enum: ['pending', 'collecting', 'confirmed', 'preparing', 'delivered', 'cancelled', 'expired'],
    default: 'pending'
  },

  // Tracking
  created_by: String,
  confirmed_by: [String],
  delivered_at: Date

}, {
  timestamps: true
});

// Indexes
bulkOrderRequestSchema.index({ requester_id: 1, status: 1 });
bulkOrderRequestSchema.index({ 'location.neighborhood': 1, status: 1 });
bulkOrderRequestSchema.index({ 'items.sku': 1, status: 1 });
bulkOrderRequestSchema.index({ aggregation: 1, deadline: 1 });

const BulkOrderRequest = mongoose.model('BulkOrderRequest', bulkOrderRequestSchema);

// ============================================================================
// Bulk Order Participant
// Individual joining a bulk order
// ============================================================================

const bulkOrderParticipantSchema = new mongoose.Schema({
  request_id: {
    type: String,
    required: true,
    index: true
  },
  user_id: {
    type: String,
    required: true,
    index: true
  },
  user_name: String,
  unit_number: String,

  // Their items in this bulk order
  items: [{
    sku: String,
    name: String,
    quantity: Number,
    unit: String
  }],

  // Payment
  amount_owed: {
    type: Number,
    default: 0
  },
  payment_status: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  payment_id: String,

  // Delivery
  delivery_preference: {
    type: String,
    enum: ['pickup', 'delivery_to_unit', 'join_pool'],
    default: 'join_pool'
  },

  // Status
  status: {
    type: String,
    enum: ['joined', 'confirmed', 'ready', 'delivered', 'cancelled'],
    default: 'joined'
  },

  joined_at: {
    type: Date,
    default: Date.now
  },
  cancelled_at: Date

}, {
  timestamps: true
});

bulkOrderParticipantSchema.index({ request_id: 1, user_id: 1 }, { unique: true });
bulkOrderParticipantSchema.index({ user_id: 1, status: 1 });

const BulkOrderParticipant = mongoose.model('BulkOrderParticipant', bulkOrderParticipantSchema);

// ============================================================================
// Bulk Order Notification
// Track notifications sent to neighbors
// ============================================================================

const bulkOrderNotificationSchema = new mongoose.Schema({
  request_id: {
    type: String,
    required: true,
    index: true
  },
  notification_type: {
    type: String,
    enum: ['new_request', 'reminder', 'confirmed', 'delivered', 'cancelled'],
    required: true
  },
  channel: {
    type: String,
    enum: ['push', 'sms', 'email', 'in_app', 'buzzlocal'],
    required: true
  },
  recipient_count: {
    type: Number,
    default: 0
  },
  sent_at: {
    type: Date,
    default: Date.now
  },
  message: String

});

const BulkOrderNotification = mongoose.model('BulkOrderNotification', bulkOrderNotificationSchema);

// ============================================================================
// Model Exports
// ============================================================================

module.exports = {
  BulkOrderRequest,
  BulkOrderParticipant,
  BulkOrderNotification
};
