/**
 * REZ Integration Connector for Rendez
 * Drop this file into: services/REZConnector.js
 */

const axios = require('axios');

class REZRendezConnector {
  constructor(config = {}) {
    this.config = {
      baseUrl: config.baseUrl || process.env.REZ_API_URL || 'http://localhost:4091',
      apiKey: config.apiKey || process.env.REZ_API_KEY,
      debug: config.debug || false
    };
    this.userId = null;
  }

  log(...args) {
    if (this.config.debug) console.log('[REZ-Rendez]', ...args);
  }

  async init(user) {
    this.userId = user.id;
    try {
      await this.resolveIdentity({
        phone: user.phone,
        email: user.email,
        sourceApp: 'rendez',
        sourceUserId: user.id
      });
    } catch (err) {
      this.log('Identity resolution failed:', err.message);
    }
  }

  async resolveIdentity(identifiers) {
    try {
      const response = await axios.post(`${this.config.baseUrl}/resolve`, identifiers, {
        headers: { 'X-REZ-API-Key': this.config.apiKey },
        timeout: 5000
      });
      this.userId = response.data.unifiedId;
      return response.data;
    } catch (err) {
      return null;
    }
  }

  // Track profile view
  async trackProfileView(profile) {
    return this.track('profile_view', {
      viewedUserId: profile.id,
      matched: profile.isMatched
    });
  }

  // Track match
  async trackMatch(match) {
    return this.track('match_made', {
      matchId: match.id,
      matchedUserId: match.userId,
      matchType: match.type,
      mutual: match.mutual
    });
  }

  // Track message
  async trackMessage(message) {
    return this.track('message_sent', {
      matchId: message.matchId,
      recipientId: message.recipientId,
      messageType: message.type
    });
  }

  // Track meetup scheduled
  async trackMeetupScheduled(meetup) {
    return this.track('meetup_scheduled', {
      meetupId: meetup.id,
      placeId: meetup.placeId,
      placeName: meetup.placeName,
      time: meetup.time
    });
  }

  // Track meetup completed
  async trackMeetupCompleted(meetup) {
    return this.track('meetup_completed', {
      meetupId: meetup.id,
      rating: meetup.rating
    });
  }

  // Track gift
  async trackGiftSent(gift) {
    return this.track('gift_sent', {
      giftId: gift.id,
      recipientId: gift.recipientId,
      giftType: gift.type,
      amount: gift.amount
    });
  }

  // Track search
  async trackSearch(search) {
    return this.track('search', {
      query: search.query,
      results: search.resultCount,
      filters: search.filters
    });
  }

  // Get matchmaking recommendations
  async getRecommendations(options = {}) {
    if (!this.userId) return [];

    try {
      const response = await axios.get(
        `${this.config.baseUrl}/api/recommendations/${this.userId}`,
        {
          params: {
            types: options.types || 'personalized',
            limit: options.limit || 10,
            context: 'dating'
          },
          headers: { 'X-REZ-API-Key': this.config.apiKey },
          timeout: 5000
        }
      );
      return response.data.recommendations || [];
    } catch (err) {
      this.log('Recommendations failed:', err.message);
      return [];
    }
  }

  async track(eventType, properties) {
    try {
      await axios.post(`${this.config.baseUrl}/api/events/track`, {
        eventType,
        userId: this.userId,
        appId: 'rendez',
        properties,
        timestamp: new Date().toISOString()
      }, {
        headers: { 'X-REZ-API-Key': this.config.apiKey },
        timeout: 5000
      });
      this.log(`Tracked: ${eventType}`);
    } catch (err) {
      this.log(`Track failed: ${eventType}`, err.message);
    }
  }
}

function rezMiddleware(req, res, next) {
  req.rez = new REZRendezConnector();
  if (req.user) req.rez.init(req.user).catch(() => {});
  next();
}

module.exports = { REZRendezConnector, rezMiddleware };
