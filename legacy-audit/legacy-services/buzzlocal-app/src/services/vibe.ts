import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Service URLs
const VIBE_URL = process.env.EXPO_PUBLIC_VIBE_URL || 'https://buzzlocal-vibe.onrender.com';
const MIND_URL = process.env.EXPO_PUBLIC_MIND_URL || 'https://rez-mind.onrender.com';

// API instance
const api = axios.create({
  baseURL: VIBE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Add auth token
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['X-App-Id'] = 'buzzlocal';
  return config;
});

// Track to REZ Mind
const trackToMind = async (eventType: string, data) => {
  try {
    await axios.post(`${MIND_URL}/events`, {
      type: eventType,
      data,
      source: 'buzzlocal',
      timestamp: Date.now(),
    }, { timeout: 5000 });
  } catch (error) {
    console.log('REZ Mind tracking failed (non-critical):', eventType);
  }
};

export interface VibeArea {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    area?: string;
    city?: string;
  };
  mood: 'quiet' | 'chill' | 'busy' | 'party';
  crowdLevel: number; // 1-5
  activeUsers: number;
  trendingTags: string[];
  lastUpdated: string;
}

export interface CheckIn {
  id: string;
  userId: string;
  vibeAreaId: string;
  mood: string;
  duration?: number;
  createdAt: string;
}

export interface HeatmapPoint {
  latitude: number;
  longitude: number;
  intensity: number; // 0-1
}

class VibeService {
  /**
   * Get nearby vibe areas
   */
  async getNearbyAreas(params: {
    lat: number;
    lng: number;
    radius?: number;
    limit?: number;
  }): Promise<VibeArea[]> {
    try {
      const response = await api.get('/vibe/areas', { params });
      return response.data.areas;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch areas';
      throw new Error(message);
    }
  }

  /**
   * Get crowd heatmap
   */
  async getHeatmap(params: {
    lat: number;
    lng: number;
    radius?: number;
  }): Promise<HeatmapPoint[]> {
    try {
      const response = await api.get('/vibe/heatmap', { params });
      return response.data.points;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch heatmap';
      throw new Error(message);
    }
  }

  /**
   * Check in to a vibe area
   */
  async checkIn(areaId: string, mood: string): Promise<CheckIn> {
    try {
      const response = await api.post('/checkin', { areaId, mood });
      const checkIn = response.data.checkIn;

      // Track to REZ Mind
      await trackToMind('check_in', {
        areaId,
        mood,
        location: checkIn.location,
        timestamp: Date.now(),
      });

      // Update local stats
      await this.updateLocalStats('checkin');

      return checkIn;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to check in';
      throw new Error(message);
    }
  }

  /**
   * Check out from current area
   */
  async checkOut(checkInId: string): Promise<void> {
    try {
      await api.post('/checkin/out', { checkInId });

      // Track to REZ Mind
      await trackToMind('check_out', {
        checkInId,
        timestamp: Date.now(),
      });
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to check out';
      throw new Error(message);
    }
  }

  /**
   * Get check-in history
   */
  async getCheckInHistory(page: number = 1): Promise<CheckIn[]> {
    try {
      const response = await api.get('/checkin/history', {
        params: { page },
      });
      return response.data.checkIns;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch history';
      throw new Error(message);
    }
  }

  /**
   * Get current check-in
   */
  async getCurrentCheckIn(): Promise<CheckIn | null> {
    try {
      const response = await api.get('/checkin/current');
      return response.data.checkIn;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get area mood
   */
  async getAreaMood(areaId: string): Promise<{
    mood: string;
    crowdLevel: number;
    peakHours: string[];
    recommendations: string[];
  }> {
    try {
      const response = await api.get(`/vibe/areas/${areaId}/mood`);
      return response.data;
    } catch (error) {
      // Return defaults
      return {
        mood: 'chill',
        crowdLevel: 3,
        peakHours: ['12:00', '18:00', '21:00'],
        recommendations: ['Check current activity', 'Best times to visit'],
      };
    }
  }

  /**
   * Get trending areas
   */
  async getTrendingAreas(limit: number = 10): Promise<VibeArea[]> {
    try {
      const response = await api.get('/vibe/trending', { params: { limit } });
      return response.data.areas;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch trending';
      throw new Error(message);
    }
  }

  /**
   * Get mood history for area
   */
  async getMoodHistory(areaId: string, hours: number = 24): Promise<{
    history: { time: string; mood: string; crowdLevel: number }[];
  }> {
    try {
      const response = await api.get(`/vibe/areas/${areaId}/history`, {
        params: { hours },
      });
      return response.data;
    } catch (error) {
      return { history: [] };
    }
  }

  /**
   * Get user's vibe stats
   */
  async getUserStats(): Promise<{
    totalCheckIns: number;
    areasVisited: number;
    favoriteArea: string;
    totalTime: number;
    streak: number;
  }> {
    try {
      const response = await api.get('/vibe/stats');
      return response.data.stats;
    } catch (error) {
      // Return defaults
      return {
        totalCheckIns: 0,
        areasVisited: 0,
        favoriteArea: 'Unknown',
        totalTime: 0,
        streak: 0,
      };
    }
  }

  /**
   * Update local stats cache
   */
  private async updateLocalStats(action: string): Promise<void> {
    try {
      const stats = await AsyncStorage.getItem('vibeStats');
      const data = stats ? JSON.parse(stats) : {
        totalCheckIns: 0,
        lastCheckIn: null,
        streak: 0,
      };

      data.totalCheckIns += 1;
      data.lastCheckIn = new Date().toISOString();

      // Check streak
      if (data.lastCheckIn) {
        const lastDate = new Date(data.lastCheckIn);
        const today = new Date();
        const diff = today.getTime() - lastDate.getTime();
        const hours = diff / (1000 * 60 * 60);

        if (hours < 24) {
          data.streak += 1;
        } else {
          data.streak = 1;
        }
      }

      await AsyncStorage.setItem('vibeStats', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to update local stats:', error);
    }
  }

  /**
   * Get cached vibe stats
   */
  async getCachedStats(): Promise<{
    totalCheckIns: number;
    streak: number;
  } | null> {
    try {
      const stats = await AsyncStorage.getItem('vibeStats');
      if (stats) {
        const data = JSON.parse(stats);
        return {
          totalCheckIns: data.totalCheckIns,
          streak: data.streak,
        };
      }
    } catch (error) {
      // Ignore
    }
    return null;
  }

  /**
   * Get mood emojis
   */
  getMoodEmoji(mood: string): string {
    const emojis: Record<string, string> = {
      quiet: '😌',
      chill: '😎',
      busy: '💃',
      party: '🔥',
    };
    return emojis[mood] || '📍';
  }

  /**
   * Get mood color
   */
  getMoodColor(mood: string): string {
    const colors: Record<string, string> = {
      quiet: '#22C55E',
      chill: '#10B981',
      busy: '#F59E0B',
      party: '#EF4444',
    };
    return colors[mood] || '#6B7280';
  }

  /**
   * Get crowd level description
   */
  getCrowdDescription(level: number): string {
    if (level <= 1) return 'Very quiet';
    if (level <= 2) return 'Not crowded';
    if (level <= 3) return 'Moderate';
    if (level <= 4) return 'Crowded';
    return 'Very crowded';
  }
}

export const vibeService = new VibeService();
