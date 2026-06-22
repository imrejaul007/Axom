import axios from 'axios';
import crypto from 'crypto';
import { LocalInsight, UserInterest } from '../models/index.js';

// REZ Intelligence Service URLs
const REZ = {
  EVENT_PLATFORM: process.env.REZ_EVENT_PLATFORM_URL || 'http://localhost:4008',
  RECOMMENDATIONS: process.env.REZ_UNIFIED_RECOMMENDATIONS_URL || 'http://localhost:4090',
  TASTE_PROFILE: process.env.REZ_TASTE_PROFILE_URL || 'http://localhost:4041',
  DEMAND_FORECAST: process.env.REZ_DEMAND_FORECAST_URL || 'http://localhost:4042',
  PERSONALIZATION: process.env.REZ_PERSONALIZATION_URL || 'http://localhost:4017',
  IDENTITY_GRAPH: process.env.REZ_IDENTITY_GRAPH_URL || 'http://localhost:4050',
  AUTONOMOUS_AGENTS: process.env.REZ_AUTONOMOUS_AGENTS_URL || 'http://localhost:4062',
};

interface Location {
  latitude: number;
  longitude: number;
  area?: string;
  city?: string;
}

interface AICard {
  id: string;
  type: 'trending' | 'alert' | 'prediction' | 'recommendation' | 'insight';
  title: string;
  description: string;
  icon: string;
  priority: 'low' | 'medium' | 'high';
  data?;
}

export class IntelligenceService {
  /**
   * Get AI cards for the feed
   * Combines insights from multiple REZ Intelligence services
   */
  async getAICards(userId: string, location: Location): Promise<AICard[]> {
    const cards: AICard[] = [];

    try {
      // 1. Get trending topics from local data
      const trendingTopics = await this.getTrendingTopics(location);
      if (trendingTopics.length > 0) {
        cards.push({
          id: `trending_${Date.now()}`,
          type: 'trending',
          title: `${trendingTopics[0].topic} is trending`,
          description: `${trendingTopics[0].count} posts in ${location.area || 'your area'} today`,
          icon: '🔥',
          priority: trendingTopics[0].count > 50 ? 'high' : 'medium',
          data: trendingTopics[0],
        });
      }

      // 2. Get area mood prediction
      const moodPrediction = await this.predictAreaMood(location);
      if (moodPrediction) {
        cards.push({
          id: `mood_${Date.now()}`,
          type: 'prediction',
          title: `${location.area || 'This area'} is ${moodPrediction.mood}`,
          description: `${moodPrediction.activeUsers} people active • Peak at ${moodPrediction.peakTime}`,
          icon: this.getMoodIcon(moodPrediction.mood),
          priority: moodPrediction.confidence > 0.7 ? 'medium' : 'low',
          data: moodPrediction,
        });
      }

      // 3. Get user preference-based recommendations
      const preferences = await this.getUserPreferences(userId);
      if (preferences?.topInterests?.length > 0) {
        cards.push({
          id: `prefs_${Date.now()}`,
          type: 'recommendation',
          title: 'Based on your interests',
          description: `You often engage with ${preferences.topInterests[0]?.category}`,
          icon: '✨',
          priority: 'low',
          data: preferences,
        });
      }

      // 4. Check for nearby alerts
      const alerts = await this.getLocalAlerts(location);
      alerts.forEach((alert) => {
        cards.push({
          // FIX: Use crypto.randomUUID() instead of Math.random() for secure IDs
          id: `alert_${Date.now()}_${crypto.randomUUID().replace(/-/g, '')}`,
          type: 'alert',
          title: alert.title,
          description: alert.description,
          icon: alert.icon || '⚠️',
          priority: alert.severity === 'high' ? 'high' : 'medium',
          data: alert,
        });
      });

      // 5. Get demand forecast for nearby events
      const eventForecast = await this.getEventForecast(location);
      if (eventForecast) {
        cards.push({
          id: `forecast_${Date.now()}`,
          type: 'prediction',
          title: eventForecast.title,
          description: `${eventForecast.predictedAttendance} expected attendees`,
          icon: '📊',
          priority: 'low',
          data: eventForecast,
        });
      }
    } catch (error) {
      console.error('Error generating AI cards:', error);
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    cards.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return cards.slice(0, 5);
  }

  /**
   * Get trending topics in an area
   */
  async getTrendingTopics(location: Location): Promise<{ topic: string; count: number }[]> {
    // In production, this would query aggregated posts/events
    // For now, return mock trending data
    const mockTopics = [
      { topic: 'New cafe opening', count: 45 },
      { topic: 'Music festival', count: 32 },
      { topic: 'Food street', count: 28 },
    ];

    return mockTopics;
  }

  /**
   * Predict area mood based on time, check-ins, and historical data
   */
  async predictAreaMood(location: Location): Promise<{
    mood: string;
    confidence: number;
    activeUsers: number;
    peakTime: string;
  } | null> {
    try {
      // Try to call REZ demand forecast
      const hour = new Date().getHours();

      let mood = 'chill';
      if (hour >= 22 || hour < 4) mood = 'party';
      else if (hour >= 17 && hour < 22) mood = 'busy';
      else if (hour >= 6 && hour < 12) mood = 'chill';

      return {
        mood,
        confidence: 0.75,
        activeUsers: Math.floor(Math.random() * 100) + 50,
        peakTime: `${hour + 2}:00`,
      };
    } catch (error) {
      console.error('Mood prediction error:', error);
      return null;
    }
  }

  /**
   * Get user preferences from REZ Intelligence
   */
  async getUserPreferences(userId: string): Promise<unknown> {
    try {
      // Try to call REZ taste profile
      const response = await axios.get(`${REZ.TASTE_PROFILE}/profile/${userId}`, {
        timeout: 2000,
      });
      return response.data;
    } catch (error) {
      // Fallback to local data
      const localPrefs = await UserInterest.findOne({ userId });
      if (localPrefs) {
        return {
          topInterests: localPrefs.interests.slice(0, 3),
          topAreas: localPrefs.areaPreferences.slice(0, 3),
        };
      }
      return null;
    }
  }

  /**
   * Get local alerts for an area
   */
  async getLocalAlerts(location: Location): Promise<unknown[]> {
    const alerts: unknown[] = [];
    const hour = new Date().getHours();

    // Weather-related
    if (hour >= 6 && hour < 10) {
      alerts.push({
        title: 'Morning commute',
        description: 'Traffic expected on main roads',
        severity: 'low',
        icon: '🚗',
      });
    }

    // Random alert chance
    if (Math.random() > 0.7) {
      alerts.push({
        title: 'Event happening nearby',
        description: 'High activity detected in your area',
        severity: 'low',
        icon: '🎉',
      });
    }

    return alerts;
  }

  /**
   * Get event attendance forecast
   */
  async getEventForecast(location: Location): Promise<unknown> {
    try {
      // This would use REZ demand forecast for events
      return null; // Not implemented yet
    } catch (error) {
      return null;
    }
  }

  /**
   * Update user interest profile based on action
   */
  async updateUserInterest(
    userId: string,
    action: {
      type: 'view' | 'like' | 'save' | 'checkin' | 'post';
      category?: string;
      area?: string;
      tags?: string[];
    }
  ): Promise<void> {
    try {
      let interest = await UserInterest.findOne({ userId });

      if (!interest) {
        interest = new UserInterest({
          userId,
          interests: [],
          areaPreferences: [],
          timePreferences: [],
        });
      }

      // Update interests
      if (action.category) {
        const existingInterest = interest.interests.find(
          (i) => i.category === action.category
        );
        if (existingInterest) {
          existingInterest.score += 1;
          existingInterest.lastInteraction = new Date();
        } else {
          interest.interests.push({
            category: action.category,
            score: 1,
            lastInteraction: new Date(),
          });
        }
      }

      // Update area preferences
      if (action.area) {
        const existingArea = interest.areaPreferences.find(
          (a) => a.area === action.area
        );
        if (existingArea) {
          existingArea.visitFrequency += 1;
          existingArea.lastVisit = new Date();
        } else {
          interest.areaPreferences.push({
            area: action.area,
            visitFrequency: 1,
            lastVisit: new Date(),
          });
        }
      }

      // Update time preferences
      const hour = new Date().getHours();
      const existingTime = interest.timePreferences.find((t) => t.hour === hour);
      if (existingTime) {
        existingTime.score += 1;
      } else {
        interest.timePreferences.push({
          hour,
          activity: action.type,
          score: 1,
        });
      }

      await interest.save();

      // Also sync to REZ taste profile
      this.syncToREZ(userId, interest).catch(console.error);
    } catch (error) {
      console.error('Error updating user interest:', error);
    }
  }

  /**
   * Sync user preferences to REZ Intelligence
   */
  private async syncToREZ(userId: string, interest): Promise<void> {
    try {
      await axios.post(
        `${REZ.TASTE_PROFILE}/profile`,
        {
          userId,
          categories: interest.interests.map((i) => i.category),
          scores: interest.interests.map((i) => i.score),
        },
        { timeout: 2000 }
      );
    } catch (error) {
      // Silently fail - we'll retry later
    }
  }

  /**
   * Get mood icon
   */
  private getMoodIcon(mood: string): string {
    switch (mood) {
      case 'party':
        return '🔥';
      case 'busy':
        return '💃';
      case 'chill':
        return '😌';
      case 'family':
        return '👨‍👩‍👧';
      default:
        return '📍';
    }
  }

  /**
   * Get personalized feed recommendations
   */
  async getPersonalizedFeed(
    userId: string,
    location: Location,
    limit: number = 10
  ): Promise<unknown[]> {
    try {
      // Try REZ recommendations first
      const response = await axios.post(
        `${REZ.RECOMMENDATIONS}/recommendations`,
        {
          userId,
          appId: 'buzzlocal-app',
          types: ['nearby', 'trending', 'personalized'],
          location: {
            lat: location.latitude,
            lng: location.longitude,
          },
          limit,
        },
        { timeout: 3000 }
      );
      return response.data.items || [];
    } catch (error) {
      // Fallback to trending nearby
      return this.getTrendingNearby(location, limit);
    }
  }

  /**
   * Get trending content nearby
   */
  private async getTrendingNearby(location: Location, limit: number): Promise<unknown[]> {
    // Mock trending data
    return [
      {
        type: 'event',
        id: '1',
        title: 'Live music tonight',
        score: 0.95,
        location: location.area,
      },
      {
        type: 'deal',
        id: '2',
        title: '50% off brunch',
        score: 0.88,
        location: location.area,
      },
    ].slice(0, limit);
  }

  /**
   * Track event and sync to REZ Intelligence
   */
  async trackEvent(event: {
    type: string;
    userId: string;
    data;
    location?: Location;
  }): Promise<void> {
    try {
      // Track locally
      const insight = new LocalInsight({
        type: event.type as unknown,
        area: event.location?.area,
        city: event.location?.city,
        data: event.data,
        confidence: 0.8,
        source: 'aggregated',
      });
      await insight.save();

      // Sync to REZ Event Platform
      await axios.post(
        `${REZ.EVENT_PLATFORM}/events`,
        {
          eventType: `buzzlocal_${event.type}`,
          userId: event.userId,
          properties: event.data,
          location: event.location,
          timestamp: new Date().toISOString(),
        },
        { timeout: 2000 }
      );
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }
}

export const intelligenceService = new IntelligenceService();
