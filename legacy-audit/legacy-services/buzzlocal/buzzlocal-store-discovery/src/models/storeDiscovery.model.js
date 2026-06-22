/**
 * Store Discovery Models
 * FreshMart 9AM Story: "Family moves into HSR → searches 'grocery store near me' → BuzzLocal recommends FreshMart"
 */

const mongoose = require('mongoose');

const storeDiscoverySchema = new mongoose.Schema({
  discovery_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // User/Resident info
  user_id: String,
  user_type: {
    type: String,
    enum: ['resident', 'new_mover', 'visitor', 'business'],
    default: 'resident'
  },

  // Location
  location: {
    address: String,
    neighborhood: {
      type: String,
      index: true
    },
    coordinates: {
      lat: { type: Number, index: true },
      lng: { type: Number, index: true }
    }
  },

  // Search/Discovery context
  search: {
    query: String,
    category: {
      type: String,
      enum: ['grocery', 'restaurant', 'pharmacy', 'cafe', 'retail', 'all'],
      default: 'all'
    },
    intent: {
      type: String,
      enum: ['nearby', 'delivery', 'browse', 'compare'],
      default: 'nearby'
    }
  },

  // Results
  results: [{
    store_id: String,
    store_name: String,
    distance: Number,
    rating: Number,
    match_score: Number,
    reasons: [String],
    delivery_available: Boolean,
    delivery_time: Number,
    categories: [String],
    featured: Boolean,
    clicked: Boolean,
    selected: Boolean
  }],

  // Selection
  selected_store: String,
  selection_reason: String,

  // Analytics
  search_time: Number,
  results_count: Number,
  conversion: {
    type: String,
    enum: ['clicked', 'selected', 'ordered', null],
    default: null
  },

  created_at: {
    type: Date,
    default: Date.now,
    index: true
  }

}, { timestamps: true });

storeDiscoverySchema.index({ 'location.neighborhood': 1, 'search.category': 1, created_at: -1 });
storeDiscoverySchema.index({ 'location.coordinates': '2dsphere' });

const StoreDiscovery = mongoose.model('StoreDiscovery', storeDiscoverySchema);

// ============================================================================
// Store Recommendation Score
// ============================================================================

const storeRecommendationSchema = new mongoose.Schema({
  store_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  store_name: String,
  category: {
    type: String,
    enum: ['grocery', 'restaurant', 'pharmacy', 'cafe', 'retail'],
    default: 'grocery'
  },
  neighborhood: {
    type: String,
    required: true,
    index: true
  },

  // Scoring components
  scores: {
    distance: Number,        // Proximity score
    rating: Number,         // Review rating
    reviews: Number,        // Number of reviews
    delivery: Number,        // Delivery availability
    match: Number,          // Category match
    freshness: Number,      // How recently updated
    engagement: Number       // Click-through rate
  },

  // Aggregated
  total_score: {
    type: Number,
    default: 0,
    index: true
  },

  // Popularity
  searches: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  conversions: { type: Number, default: 0 },

  // Status
  active: {
    type: Boolean,
    default: true
  },

  last_updated: {
    type: Date,
    default: Date.now
  }

}, { timestamps: true });

storeRecommendationSchema.index({ neighborhood: 1, category: 1, total_score: -1 });

const StoreRecommendation = mongoose.model('StoreRecommendation', storeRecommendationSchema);

// ============================================================================
// New Resident Tracking
// ============================================================================

const newResidentSchema = new mongoose.Schema({
  resident_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // When they moved
  move_in_date: Date,

  // Location
  address: String,
  neighborhood: {
    type: String,
    index: true
  },
  coordinates: {
    lat: Number,
    lng: Number
  },

  // Discovery status
  discovery_completed: {
    type: Boolean,
    default: false
  },
  first_store_discovered: String,
  first_discovery_at: Date,

  // Preferences
  interests: [String],

  // Welcome sent
  welcome_sent: {
    type: Boolean,
    default: false
  },
  welcome_sent_at: Date

}, { timestamps: true });

newResidentSchema.index({ neighborhood: 1, discovery_completed: 1 });

const NewResident = mongoose.model('NewResident', newResidentSchema);

module.exports = {
  StoreDiscovery,
  StoreRecommendation,
  NewResident
};
