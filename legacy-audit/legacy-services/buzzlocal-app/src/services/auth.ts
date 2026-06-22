import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// RABTUL Auth Service URLs
const AUTH_URL = process.env.EXPO_PUBLIC_AUTH_URL || 'https://rez-auth-service.onrender.com';

// API instance with interceptors
const api = axios.create({
  baseURL: AUTH_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        const response = await axios.post(`${AUTH_URL}/auth/refresh`, { refreshToken });
        const { token } = response.data;
        await SecureStore.setItemAsync('authToken', token);
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Logout user
        await authService.logout();
        throw refreshError;
      }
    }
    throw error;
  }
);

export interface User {
  id: string;
  phone: string;
  name: string;
  email?: string;
  avatar?: string;
  reputation: number;
  reputationLevel: string;
  coinBalance: number;
  interests: string[];
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

class AuthService {
  /**
   * Send OTP to phone number via RABTUL Auth
   */
  async sendOtp(phone: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post('/user/auth/send-otp', { phone });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send OTP';
      throw new Error(message);
    }
  }

  /**
   * Verify OTP and get tokens via RABTUL Auth
   */
  async verifyOtp(phone: string, otp: string): Promise<AuthResponse> {
    try {
      const response = await api.post('/user/auth/verify-otp', { phone, otp });
      const data = response.data;

      // Store tokens securely
      await SecureStore.setItemAsync('authToken', data.token);
      await SecureStore.setItemAsync('refreshToken', data.refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));

      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Invalid OTP';
      throw new Error(message);
    }
  }

  /**
   * Register new user via RABTUL Auth
   */
  async register(phone: string, name: string, email?: string): Promise<AuthResponse> {
    try {
      const response = await api.post('/user/auth/register', { phone, name, email });
      const data = response.data;

      // Store tokens securely
      await SecureStore.setItemAsync('authToken', data.token);
      await SecureStore.setItemAsync('refreshToken', data.refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));

      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      throw new Error(message);
    }
  }

  /**
   * Get current user from RABTUL Auth
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await api.get('/user/profile');
      const user = response.data;

      // Update local storage
      await AsyncStorage.setItem('user', JSON.stringify(user));

      return user;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch profile';
      throw new Error(message);
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    try {
      const response = await api.patch('/user/profile', data);
      const user = response.data;

      await AsyncStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update profile';
      throw new Error(message);
    }
  }

  /**
   * Update user interests
   */
  async updateInterests(interests: string[]): Promise<User> {
    return this.updateProfile({ interests });
  }

  /**
   * Refresh token
   */
  async refreshToken(): Promise<{ token: string; refreshToken: string }> {
    try {
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token');
      }

      const response = await axios.post(`${AUTH_URL}/auth/refresh`, { refreshToken });
      const { token, refreshToken: newRefreshToken } = response.data;

      await SecureStore.setItemAsync('authToken', token);
      await SecureStore.setItemAsync('refreshToken', newRefreshToken);

      return { token, refreshToken: newRefreshToken };
    } catch (error) {
      await this.logout();
      throw new Error('Session expired. Please login again.');
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await api.post('/user/auth/logout');
    } catch (error) {
      // Ignore logout errors
    } finally {
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('refreshToken');
      await AsyncStorage.removeItem('user');
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await SecureStore.getItemAsync('authToken');
    return !!token;
  }

  /**
   * Get cached user
   */
  async getCachedUser(): Promise<User | null> {
    const userData = await AsyncStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Get auth token
   */
  async getToken(): Promise<string | null> {
    return await SecureStore.getItemAsync('authToken');
  }

  /**
   * Set device token for push notifications
   */
  async setDeviceToken(token: string): Promise<void> {
    try {
      await api.post('/user/device-token', { token, platform: 'ios' });
    } catch (error) {
      console.error('Failed to set device token:', error);
    }
  }
}

export const authService = new AuthService();
export { api as authApi };
