import logger from '../utils/logger';

import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// RABTUL Wallet Service URLs
const WALLET_URL = process.env.EXPO_PUBLIC_WALLET_URL || 'https://rez-wallet-service.onrender.com';

// API instance with interceptors
const api = axios.create({
  baseURL: WALLET_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['X-App-Id'] = 'buzzlocal';
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - user needs to re-login
      logger.info('Wallet: Unauthorized');
    }
    throw error;
  }
);

export interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  reason: string;
  source: string;
  relatedId?: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export interface WalletBalance {
  balance: number;
  currency: string;
  lastUpdated: string;
}

export interface TransactionList {
  transactions: Transaction[];
  total: number;
  page: number;
  hasMore: boolean;
}

export interface CoinEarnResult {
  newBalance: number;
  transactionId: string;
  bonusCoins?: number;
}

export interface CoinSpendResult {
  newBalance: number;
  transactionId: string;
}

class WalletService {
  /**
   * Get wallet balance from RABTUL Wallet
   */
  async getBalance(): Promise<WalletBalance> {
    try {
      const response = await api.get('/wallet/balance');
      const data = response.data;

      // Update local cache
      await AsyncStorage.setItem('walletBalance', JSON.stringify({
        balance: data.balance,
        currency: data.currency || 'coins',
        lastUpdated: new Date().toISOString(),
      }));

      return {
        balance: data.balance,
        currency: data.currency || 'coins',
        lastUpdated: data.lastUpdated || new Date().toISOString(),
      };
    } catch (error) {
      // Try cached balance
      const cached = await AsyncStorage.getItem('walletBalance');
      if (cached) {
        return JSON.parse(cached);
      }
      const message = error.response?.data?.message || 'Failed to fetch balance';
      throw new Error(message);
    }
  }

  /**
   * Get transaction history from RABTUL Wallet
   */
  async getTransactions(page: number = 1, limit: number = 20): Promise<TransactionList> {
    try {
      const response = await api.get('/wallet/transactions', {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch transactions';
      throw new Error(message);
    }
  }

  /**
   * Earn coins from RABTUL Wallet
   * Used for: posting, likes, check-ins, etc.
   */
  async earnCoins(
    amount: number,
    reason: string,
    relatedId?: string
  ): Promise<CoinEarnResult> {
    try {
      const response = await api.post('/wallet/earn', {
        amount,
        reason,
        source: 'buzzlocal',
        relatedId,
        idempotencyKey: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      });

      // Update local cache
      await this.updateLocalBalance(response.data.newBalance);

      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to earn coins';
      throw new Error(message);
    }
  }

  /**
   * Spend coins on RABTUL Wallet
   * Used for: buying tickets, redeeming offers
   */
  async spendCoins(
    amount: number,
    reason: string,
    merchantId?: string
  ): Promise<CoinSpendResult> {
    try {
      const response = await api.post('/wallet/spend', {
        amount,
        reason,
        destination: 'buzzlocal',
        merchantId,
        idempotencyKey: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      });

      // Update local cache
      await this.updateLocalBalance(response.data.newBalance);

      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to spend coins';
      throw new Error(message);
    }
  }

  /**
   * Transfer coins to another user
   */
  async transferCoins(
    toUserId: string,
    amount: number,
    reason: string
  ): Promise<{ newBalance: number; transactionId: string }> {
    try {
      const response = await api.post('/wallet/transfer', {
        toUserId,
        amount,
        reason,
      });

      await this.updateLocalBalance(response.data.newBalance);

      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to transfer coins';
      throw new Error(message);
    }
  }

  /**
   * Get coin balance from local cache (for quick access)
   */
  async getCachedBalance(): Promise<number | null> {
    const cached = await AsyncStorage.getItem('walletBalance');
    if (cached) {
      const data = JSON.parse(cached);
      // Check if cache is still valid (5 minutes)
      const age = Date.now() - new Date(data.lastUpdated).getTime();
      if (age < 5 * 60 * 1000) {
        return data.balance;
      }
    }
    return null;
  }

  /**
   * Update local balance cache
   */
  private async updateLocalBalance(balance: number): Promise<void> {
    await AsyncStorage.setItem('walletBalance', JSON.stringify({
      balance,
      currency: 'coins',
      lastUpdated: new Date().toISOString(),
    }));
  }

  /**
   * Get coin rewards for actions
   */
  getCoinRewards(): Record<string, number> {
    return {
      // Posting
      general_post: 20,
      event_post: 50,
      alert_post: 40,
      place_post: 30,
      deal_post: 25,
      poll_post: 15,
      media_bonus: 10,

      // Engagement
      post_like: 1,
      post_comment: 2,
      post_save: 3,
      post_share: 5,

      // Location
      checkin: 25,
      first_checkin: 50,

      // Events
      event_rsvp: 10,
      event_attend: 20,
      event_share: 10,

      // Community
      community_join: 10,
      community_post: 15,

      // Streaks
      daily_login_streak: 10,
      weekly_streak: 50,

      // Weather
      weather_report: 5,
    };
  }

  /**
   * Calculate coin reward for an action
   */
  calculateReward(action: string, extras?: { hasMedia: boolean; isStreak: boolean }): number {
    const rewards = this.getCoinRewards();
    let reward = rewards[action] || 0;

    // Add media bonus
    if (extras?.hasMedia && action.includes('post')) {
      reward += rewards.media_bonus;
    }

    // Add streak bonus
    if (extras?.isStreak) {
      reward += rewards.daily_login_streak;
    }

    return reward;
  }
}

export const walletService = new WalletService();
export { api as walletApi };
