/**
 * Cosmic OS - API Service
 *
 * Connects to Cosmic OS backend services
 */

import axios, { AxiosInstance } from 'axios';
import * as SecureStore from 'expo-secure-store';
import type {
  CosmicState,
  DailyReading,
  CouncilResponse,
  MoodCheckIn,
  MoodResponse,
  User,
  UserWallet,
  WellnessStreak,
  DomainGuidance,
  Agent,
  CosmicContextResponse,
} from '../types';

// ============================================
// API CONFIGURATION
// ============================================

const API_BASE_URL = process.env.EXPO_PUBLIC_COSMIC_API_URL || 'http://localhost:4163';

const TIMEOUT = 10000;

// ============================================
// API CLIENT
// ============================================

class CosmicAPI {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for auth
    this.client.interceptors.request.use(
      async (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  // ============================================
  // AUTH
  // ============================================

  async sendOTP(phone: string): Promise<{ success: boolean }> {
    const response = await this.client.post('/api/auth/send-otp', { phone });
    return response.data;
  }

  async verifyOTP(phone: string, otp: string): Promise<{ success: boolean; token?: string; user?: User }> {
    const response = await this.client.post('/api/auth/verify-otp', { phone, otp });
    if (response.data.token) {
      this.token = response.data.token;
      await SecureStore.setItemAsync('cosmic_token', response.data.token);
    }
    return response.data;
  }

  async verifyToken(): Promise<boolean> {
    const token = await SecureStore.getItemAsync('cosmic_token');
    if (!token) return false;

    this.token = token;
    try {
      const response = await this.client.get('/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.success;
    } catch {
      await this.logout();
      return false;
    }
  }

  async logout(): Promise<void> {
    this.token = null;
    await SecureStore.deleteItemAsync('cosmic_token');
  }

  // ============================================
  // COSMIC CONTEXT
  // ============================================

  async getCosmicContext(userId: string): Promise<CosmicContextResponse> {
    const response = await this.client.get(`/api/cosmic/${userId}`);
    return response.data;
  }

  async getDailyReading(userId: string): Promise<{ dailyReading: DailyReading }> {
    const response = await this.client.get(`/api/cosmic/daily/${userId}`);
    return response.data;
  }

  async consultCouncil(
    userId: string,
    agents?: string[]
  ): Promise<{ council: CouncilResponse; cosmic: CosmicState }> {
    const response = await this.client.post('/api/cosmic/council', {
      userId,
      agents,
    });
    return response.data;
  }

  // ============================================
  // MOOD CHECK-IN
  // ============================================

  async checkInMood(data: MoodCheckIn): Promise<MoodResponse> {
    const response = await this.client.post('/api/mood/checkin', data);
    return response.data;
  }

  async getMoodHistory(userId: string): Promise<{ streak: WellnessStreak }> {
    const response = await this.client.get(`/api/mood/${userId}/history`);
    return response.data;
  }

  // ============================================
  // DOMAIN GUIDANCE
  // ============================================

  async getDomainGuidance(userId: string, domain: string): Promise<{
    guidance: DomainGuidance;
    cosmic: CosmicState;
  }> {
    const response = await this.client.get(`/api/guidance/${userId}/${domain}`);
    return response.data;
  }

  // ============================================
  // AGENTS
  // ============================================

  async getAgents(): Promise<{ agents: Agent[] }> {
    const response = await this.client.get('/api/agents');
    return response.data;
  }

  async consultAgent(
    userId: string,
    agentType: string,
    context?: { mood?: string; energy?: number }
  ): Promise<{ agent: Agent; insight: any; cosmic: CosmicState }> {
    const response = await this.client.post(`/api/agents/${agentType}/consult`, {
      userId,
      context,
    });
    return response.data;
  }

  // ============================================
  // USER
  // ============================================

  async getUser(userId: string): Promise<{
    user: User;
    wallet: UserWallet;
    prive: any;
    streak: WellnessStreak;
  }> {
    const response = await this.client.get(`/api/user/${userId}`);
    return response.data;
  }

  async getUserStreak(userId: string): Promise<{ streak: WellnessStreak }> {
    const response = await this.client.get(`/api/user/${userId}/streak`);
    return response.data;
  }

  async getUserWallet(userId: string): Promise<{ wallet: UserWallet }> {
    const response = await this.client.get(`/api/user/${userId}/wallet`);
    return response.data;
  }

  // ============================================
  // REWARDS
  // ============================================

  async recordMindfulness(userId: string, duration: number): Promise<{ coinsEarned: number }> {
    const response = await this.client.post('/api/rewards/mindfulness', {
      userId,
      duration,
    });
    return response.data;
  }

  async recordJournal(userId: string): Promise<{ coinsEarned: number }> {
    const response = await this.client.post('/api/rewards/journal', { userId });
    return response.data;
  }
}

// Singleton instance
export const cosmicAPI = new CosmicAPI();
export default cosmicAPI;
