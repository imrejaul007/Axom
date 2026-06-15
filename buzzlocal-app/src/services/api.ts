import logger from '../utils/logger';

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

// RABTUL Core Services
const AUTH_BASE_URL = process.env.EXPO_PUBLIC_AUTH_URL || 'https://rez-auth-service.onrender.com';
const WALLET_BASE_URL = process.env.EXPO_PUBLIC_WALLET_URL || 'https://rez-wallet-service.onrender.com';

// BuzzLocal Services
const FEED_BASE_URL = process.env.EXPO_PUBLIC_FEED_URL || 'https://buzzlocal-feed.onrender.com';
const VIBE_BASE_URL = process.env.EXPO_PUBLIC_VIBE_URL || 'https://buzzlocal-vibe.onrender.com';
const EVENTS_BASE_URL = process.env.EXPO_PUBLIC_EVENTS_URL || 'https://buzzlocal-events.onrender.com';
const INTELLIGENCE_BASE_URL = process.env.EXPO_PUBLIC_INTELLIGENCE_URL || 'https://buzzlocal-intelligence.onrender.com';
const NOTIFICATIONS_BASE_URL = process.env.EXPO_PUBLIC_NOTIFICATIONS_URL || 'https://buzzlocal-notifications.onrender.com';

// REZ Intelligence
const MIND_BASE_URL = process.env.EXPO_PUBLIC_MIND_URL || 'https://rez-mind.onrender.com';
const REZ_EVENTS_BASE_URL = process.env.EXPO_PUBLIC_REZ_EVENTS_URL || 'https://rez-event-platform.onrender.com';

// Create axios instance with interceptors
const createApiInstance = (baseURL: string, requiresAuth: boolean = true): AxiosInstance => {
  const instance = axios.create({
    baseURL,
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
      'X-App-Id': 'buzzlocal',
      'X-App-Version': '1.0.0',
    },
  });

  // Request interceptor
  instance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      if (requiresAuth) {
        try {
          const token = await SecureStore.getItemAsync('authToken');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          logger.info('Could not get auth token');
        }
      }

      // Add internal service token for service-to-service calls
      const internalToken = process.env.INTERNAL_SERVICE_TOKEN;
      if (internalToken) {
        config.headers['X-Internal-Token'] = internalToken;
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      if (error.response?.status === 401) {
        // Handle unauthorized
        logger.info('Unauthorized - need to login');
      }
      if (error.response?.status === 429) {
        // Rate limited
        logger.info('Rate limited');
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

// API Instances
export const authApi = createApiInstance(AUTH_BASE_URL);
export const walletApi = createApiInstance(WALLET_BASE_URL);
export const feedApi = createApiInstance(FEED_BASE_URL);
export const vibeApi = createApiInstance(VIBE_BASE_URL);
export const eventsApi = createApiInstance(EVENTS_BASE_URL);
export const intelligenceApi = createApiInstance(INTELLIGENCE_BASE_URL);
export const notificationsApi = createApiInstance(NOTIFICATIONS_BASE_URL);
export const mindApi = createApiInstance(MIND_BASE_URL, false); // REZ Mind doesn't need auth
export const rezEventsApi = createApiInstance(REZ_EVENTS_BASE_URL, false);

// Error handler
export const handleApiError = (error, defaultMessage: string = 'An error occurred'): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return defaultMessage;
};

// Service URLs for reference
export const SERVICE_URLS = {
  // RABTUL Core
  auth: AUTH_BASE_URL,
  wallet: WALLET_BASE_URL,

  // BuzzLocal
  feed: FEED_BASE_URL,
  vibe: VIBE_BASE_URL,
  events: EVENTS_BASE_URL,
  intelligence: INTELLIGENCE_BASE_URL,
  notifications: NOTIFICATIONS_BASE_URL,

  // REZ Intelligence
  mind: MIND_BASE_URL,
  rezEvents: REZ_EVENTS_BASE_URL,
};
