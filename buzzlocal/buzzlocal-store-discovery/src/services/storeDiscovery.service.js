/**
 * Store Discovery Service
 * FreshMart 9AM Story: "Family moves into HSR → searches 'grocery store near me' → BuzzLocal recommends FreshMart"
 */

const { StoreDiscovery, StoreRecommendation, NewResident } = require('../models/storeDiscovery.model');

class StoreDiscoveryService {

  /**
   * Discover stores near a location
   * FreshMart 9AM: "Family searches 'grocery store near me' → FreshMart recommended"
   */
  async discoverStores(data) {
    const discovery_id = `DIS-${Date.now().toString(36).toUpperCase()}`;

    // Get stores from recommendation engine
    const stores = await this.getRecommendations({
      lat: data.location.coordinates.lat,
      lng: data.location.coordinates.lng,
      category: data.search.category || 'grocery',
      limit: 10
    });

    // Track new resident if applicable
    if (data.user_type === 'new_mover') {
      await this.trackNewResident(data);
    }

    // Create discovery record
    const discovery = new StoreDiscovery({
      discovery_id,
      user_id: data.user_id,
      user_type: data.user_type,
      location: data.location,
      search: data.search,
      results: stores,
      results_count: stores.length
    });

    await discovery.save();

    return {
      discovery_id,
      stores,
      top_pick: stores[0] || null
    };
  }

  /**
   * Get store recommendations for a location
   */
  async getRecommendations(params) {
    const { lat, lng, category = 'grocery', limit = 10 } = params;

    // Get neighborhood
    const neighborhood = await this.getNeighborhood(lat, lng);

    // Query stores by neighborhood and category
    const stores = await StoreRecommendation.find({
      neighborhood,
      category,
      active: true
    })
    .sort({ total_score: -1 })
    .limit(limit);

    // If not enough stores, expand search
    if (stores.length < limit) {
      const moreStores = await StoreRecommendation.find({
        category,
        active: true,
        total_score: { $gt: 50 }
      })
      .sort({ total_score: -1 })
      .limit(limit - stores.length);

      stores.push(...moreStores);
    }

    // Calculate distance and format results
    return stores.map(store => ({
      store_id: store.store_id,
      store_name: store.store_name,
      distance: this.calculateDistance(lat, lng, store.location?.lat || lat, store.location?.lng || lng),
      rating: store.scores.rating || 4.0,
      match_score: store.total_score,
      reasons: this.getMatchReasons(store, category),
      delivery_available: true,
      delivery_time: 30, // minutes
      categories: [category],
      featured: store.total_score > 80
    }));
  }

  /**
   * Get neighborhood from coordinates (simplified)
   */
  async getNeighborhood(lat, lng) {
    // In production, use reverse geocoding or neighborhood database
    // For now, use mock data
    return 'HSR Layout';
  }

  /**
   * Calculate distance in km
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c * 10) / 10;
  }

  /**
   * Get reasons for store match
   */
  getMatchReasons(store, category) {
    const reasons = [];

    if (store.scores.rating >= 4.5) {
      reasons.push('Highly rated');
    }
    if (store.scores.delivery === 1) {
      reasons.push('Fast delivery');
    }
    if (store.total_score > 80) {
      reasons.push('Top match');
    }
    if (store.conversions > 100) {
      reasons.push('Popular choice');
    }

    return reasons.length > 0 ? reasons : ['Recommended for you'];
  }

  /**
   * Track new resident
   */
  async trackNewResident(data) {
    const existing = await NewResident.findOne({ resident_id: data.user_id });

    if (!existing) {
      await NewResident.create({
        resident_id: data.user_id,
        move_in_date: new Date(),
        address: data.location.address,
        neighborhood: data.location.neighborhood,
        coordinates: data.location.coordinates,
        interests: data.interests || []
      });
    }
  }

  /**
   * Record store selection
   */
  async selectStore(discoveryId, storeId, reason) {
    return StoreDiscovery.findOneAndUpdate(
      { discovery_id: discoveryId },
      {
        selected_store: storeId,
        selection_reason: reason,
        conversion: 'selected'
      },
      { new: true }
    );
  }

  /**
   * Update store recommendation scores
   */
  async updateScores(storeId, metrics) {
    const store = await StoreRecommendation.findOne({ store_id: storeId });
    if (!store) return null;

    // Recalculate total score
    store.scores = {
      ...store.scores,
      ...metrics
    };

    store.total_score = this.calculateTotalScore(store.scores);
    store.last_updated = new Date();

    await store.save();
    return store;
  }

  /**
   * Calculate total recommendation score
   */
  calculateTotalScore(scores) {
    const weights = {
      distance: 0.25,
      rating: 0.20,
      reviews: 0.10,
      delivery: 0.15,
      match: 0.15,
      freshness: 0.05,
      engagement: 0.10
    };

    return Object.entries(weights).reduce((total, [key, weight]) => {
      return total + (scores[key] || 0) * weight;
    }, 0);
  }

  /**
   * Register a new store
   */
  async registerStore(data) {
    const neighborhood = await this.getNeighborhood(
      data.location.coordinates.lat,
      data.location.coordinates.lng
    );

    const store = await StoreRecommendation.create({
      store_id: data.store_id,
      store_name: data.store_name,
      category: data.category || 'grocery',
      neighborhood,
      location: data.location,
      scores: {
        distance: 80,
        rating: data.rating || 4.0,
        reviews: 0,
        delivery: data.delivery_available ? 100 : 0,
        match: 100,
        freshness: 100,
        engagement: 0
      },
      total_score: 75
    });

    return store;
  }

  /**
   * Get analytics for a neighborhood
   */
  async getNeighborhoodAnalytics(neighborhood) {
    const [stores, discoveries] = await Promise.all([
      StoreRecommendation.find({ neighborhood, active: true }),
      StoreDiscovery.aggregate([
        { $match: { 'location.neighborhood': neighborhood } },
        {
          $group: {
            _id: null,
            total_searches: { $sum: 1 },
            avg_results: { $avg: '$results_count' },
            conversion_rate: {
              $avg: { $cond: [{ $eq: ['$conversion', 'selected'] }, 1, 0] }
            }
          }
        }
      ])
    ]);

    return {
      neighborhood,
      total_stores: stores.length,
      total_searches: discoveries[0]?.total_searches || 0,
      avg_results_per_search: Math.round(discoveries[0]?.avg_results || 0),
      conversion_rate: `${((discoveries[0]?.conversion_rate || 0) * 100).toFixed(1)}%`,
      top_categories: ['grocery', 'restaurant', 'pharmacy']
    };
  }
}

module.exports = new StoreDiscoveryService();
