import { logger } from '../utils/logger';

import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REALTIME_URL = process.env.EXPO_PUBLIC_REALTIME_URL || 'https://buzzlocal-realtime.onrender.com';

export interface SocketEvent {
  type: string;
  data;
  timestamp: number;
}

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(data) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnecting = false;

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    if (this.socket?.connected || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      // Get auth token
      const token = await SecureStore.getItemAsync('authToken');

      // Create socket connection
      this.socket = io(REALTIME_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      });

      // Connection events
      this.socket.on('connect', () => {
        logger.debug('Socket connected', { socketId: this.socket?.id });
        this.reconnectAttempts = 0;
        this.isConnecting = false;

        // Re-authenticate
        this.authenticate();
      });

      this.socket.on('disconnect', (reason) => {
        logger.debug('Socket disconnected', { reason });
        this.isConnecting = false;
      });

      this.socket.on('connect_error', (error) => {
        logger.error('Socket connection error', { error: error.message || String(error) });
        this.isConnecting = false;
        this.reconnectAttempts++;

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          logger.warn('Max reconnection attempts reached');
        }
      });

      // Handle events
      this.setupEventHandlers();

    } catch (error) {
      logger.error('Failed to create socket', { error: String(error) });
      this.isConnecting = false;
    }
  }

  /**
   * Authenticate with socket
   */
  private async authenticate(): Promise<void> {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData && this.socket?.connected) {
        const user = JSON.parse(userData);
        this.socket.emit('authenticate', { userId: user.id });
      }
    } catch (error) {
      logger.error('Socket auth error', { error: String(error) });
    }
  }

  /**
   * Setup default event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    // New post in area
    this.socket.on('new_post', (data) => {
      this.emit('new_post', data);
    });

    // New check-in nearby
    this.socket.on('new_checkin', (data) => {
      this.emit('new_checkin', data);
    });

    // Area mood changed
    this.socket.on('mood_change', (data) => {
      this.emit('mood_change', data);
    });

    // Event reminder
    this.socket.on('event_reminder', (data) => {
      this.emit('event_reminder', data);
    });

    // Notification
    this.socket.on('notification', (data) => {
      this.emit('notification', data);
    });

    // Authenticated
    this.socket.on('authenticated', (data) => {
      logger.debug('Socket authenticated', { data });
    });

    // Subscribed
    this.socket.on('subscribed', (data) => {
      logger.debug('Subscribed to room', { room: data.room });
    });
  }

  /**
   * Subscribe to area updates
   */
  subscribeToArea(area: string): void {
    if (this.socket?.connected) {
      this.socket.emit('subscribe', { room: `area:${area}` });
      this.socket.emit('location', { area });
    }
  }

  /**
   * Unsubscribe from area
   */
  unsubscribeFromArea(area: string): void {
    if (this.socket?.connected) {
      this.socket.emit('unsubscribe', { room: `area:${area}` });
    }
  }

  /**
   * Subscribe to room
   */
  subscribe(room: string): void {
    if (this.socket?.connected) {
      this.socket.emit('subscribe', { room });
    }
  }

  /**
   * Update location
   */
  updateLocation(area: string, city?: string): void {
    if (this.socket?.connected) {
      this.socket.emit('location', { area, city });
    }
  }

  /**
   * Emit custom event (for tracking)
   */
  emit(event: string, data?): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  /**
   * Listen to event
   */
  on(event: string, callback: (data) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  /**
   * Listen once
   */
  once(event: string, callback: (data) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  /**
   * Remove all listeners for event
   */
  off(event: string): void {
    this.listeners.delete(event);
  }

  /**
   * Remove all listeners
   */
  offAll(): void {
    this.listeners.clear();
  }

  /**
   * Disconnect from socket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get socket ID
   */
  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

export const socketService = new SocketService();
