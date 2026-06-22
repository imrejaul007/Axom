import { walletApi } from './api';

// Types for gamification
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedAt?: string;
}

export interface Streak {
  id: string;
  type: 'check_in' | 'post' | 'event' | 'review' | 'helpful';
  current: number;
  longest: number;
  lastActivity?: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar?: string;
  score: number;
  trend: 'up' | 'down' | 'same';
}

interface GamificationData {
  badges: Badge[];
  streaks: Streak[];
  leaderboards: {
    creators: LeaderboardEntry[];
    explorers: LeaderboardEntry[];
    helpful: LeaderboardEntry[];
  };
}

export const gamificationService = {
  /**
   * Get all gamification data (badges, streaks, leaderboards)
   */
  getGamificationData: async (): Promise<GamificationData> => {
    try {
      const response = await walletApi.get('/gamification');
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch gamification data.');
    }
  },

  /**
   * Get user badges
   */
  getBadges: async (): Promise<Badge[]> => {
    try {
      const response = await walletApi.get('/gamification/badges');
      return response.data.badges;
    } catch (error) {
      throw new Error('Failed to fetch badges.');
    }
  },

  /**
   * Get user streaks
   */
  getStreaks: async (): Promise<Streak[]> => {
    try {
      const response = await walletApi.get('/gamification/streaks');
      return response.data.streaks;
    } catch (error) {
      throw new Error('Failed to fetch streaks.');
    }
  },

  /**
   * Get leaderboards
   */
  getLeaderboards: async (type: 'creators' | 'explorers' | 'helpful' = 'creators'): Promise<LeaderboardEntry[]> => {
    try {
      const response = await walletApi.get(`/gamification/leaderboards/${type}`);
      return response.data.leaderboard;
    } catch (error) {
      throw new Error('Failed to fetch leaderboard.');
    }
  },

  /**
   * Record an activity for streak tracking
   */
  recordActivity: async (type: Streak['type']): Promise<{ streak: Streak; badge?: Badge }> => {
    try {
      const response = await walletApi.post('/gamification/activity', { type });
      return response.data;
    } catch (error) {
      throw new Error('Failed to record activity.');
    }
  },

  /**
   * Check and award badges
   */
  checkBadges: async (): Promise<Badge[]> => {
    try {
      const response = await walletApi.post('/gamification/check-badges');
      return response.data.newBadges;
    } catch (error) {
      throw new Error('Failed to check badges.');
    }
  },
};
