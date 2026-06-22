import axios from 'axios';

const TRUST_SERVICE_URL = process.env.EXPO_PUBLIC_TRUST_SERVICE_URL || 'http://localhost:4016';

const trustService = axios.create({
  baseURL: `${TRUST_SERVICE_URL}/api/trust`,
  timeout: 10000,
});

export interface TrustProfile {
  userId: string;
  score: number;
  level: 'new' | 'verified' | 'trusted' | 'expert' | 'guardian' | 'legend';
  levelInfo: {
    badge: string;
    color: string;
    abilities: string[];
    nextLevel?: { level: string; pointsNeeded: number };
  };
  verification: {
    phone: boolean;
    email: boolean;
    address: boolean;
    society: boolean;
    id: boolean;
  };
  badges: Array<{
    badgeId: string;
    name: string;
    icon: string;
    rarity: string;
    earnedAt: Date;
  }>;
  stats: {
    posts: number;
    answers: number;
    helpfulAnswers: number;
    followers: number;
    following: number;
    alerts: number;
    verifiedAlerts: number;
  };
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  criteria: {
    type: string;
    value: number;
  };
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  score: number;
  level: string;
  topBadge: { icon: string; name: string } | null;
  area?: string;
}

export const trustApi = {
  getScore: async (userId: string): Promise<{ success: boolean } & TrustProfile> => {
    const response = await trustService.get(`/score/${userId}`);
    return response.data;
  },

  getBadges: async (userId: string): Promise<{
    success: boolean;
    earned: Badge[];
    available: Badge[];
  }> => {
    const response = await trustService.get(`/badges/${userId}`);
    return response.data;
  },

  getLeaderboard: async (params: {
    type?: string;
    neighborhood?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ success: boolean; leaderboard: LeaderboardEntry[] }> => {
    const response = await trustService.get('/leaderboard', { params });
    return response.data;
  },

  submitVerification: async (data: {
    type: 'phone' | 'email' | 'address' | 'society' | 'id' | 'merchant';
    data?: Record<string, unknown>;
  }): Promise<{ success: boolean; verified?: boolean; pointsAwarded?: number; newLevel?: string }> => {
    const response = await trustService.post('/verify', data);
    return response.data;
  },

  updateScore: async (data: {
    type: string;
    action: 'credit' | 'debit';
    points: number;
    reason: string;
  }): Promise<{
    success: boolean;
    newScore: number;
    newLevel: string;
    levelChanged: boolean;
    newBadges: string[];
  }> => {
    const response = await trustService.post('/score/update', data);
    return response.data;
  },

  joinNeighborhood: async (neighborhoodId: string): Promise<{ success: boolean; neighborhood: string }> => {
    const response = await trustService.post('/neighborhoods/join', { neighborhoodId });
    return response.data;
  },

  getHistory: async (userId: string, limit = 50): Promise<{
    success: boolean;
    events: Array<{
      type: string;
      action: string;
      points: number;
      reason: string;
      createdAt: Date;
    }>;
  }> => {
    const response = await trustService.get(`/history/${userId}`, { params: { limit } });
    return response.data;
  },
};

export default trustApi;
