import { logger } from '../utils/logger';

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import axios from 'axios';

const NOTIFICATIONS_URL = process.env.EXPO_PUBLIC_NOTIFICATIONS_URL || 'https://buzzlocal-notifications.onrender.com';

// API for notifications backend
const api = axios.create({
  baseURL: NOTIFICATIONS_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface PushToken {
  token: string;
  type: 'expo' | 'ios' | 'android';
}

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  category?: 'post' | 'event' | 'community' | 'alert' | 'reward' | 'system';
  icon?: string;
  image?: string;
}

class NotificationService {
  private expoPushToken: string | null = null;
  private isInitialized = false;
  private notificationListeners: Notifications.Subscription[] = [];

  /**
   * Initialize notification service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Request permissions
    await this.requestPermissions();

    // Get push token
    await this.getPushToken();

    // Set up notification listeners
    this.setupListeners();

    this.isInitialized = true;
  }

  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      logger.info('Push notifications only work on physical devices');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      logger.info('Permission for notifications not granted');
      return false;
    }

    // Set up Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('buzzlocal', {
        name: 'BuzzLocal Notifications',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6366F1',
        sound: 'default',
        enableVibrate: true,
      });

      // Create category-specific channels
      await Notifications.setNotificationChannelAsync('alerts', {
        name: 'Alerts',
        importance: Notifications.AndroidImportance.MAX,
        sound: 'default',
        vibrationPattern: [0, 500, 200, 500],
        lightColor: '#EF4444',
      });

      await Notifications.setNotificationChannelAsync('events', {
        name: 'Events',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('rewards', {
        name: 'Rewards',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
      });
    }

    return true;
  }

  /**
   * Get Expo push token
   */
  async getPushToken(): Promise<string | null> {
    try {
      // Get token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      });

      this.expoPushToken = tokenData.data;
      logger.debug('Push token obtained');

      // Send token to backend
      await this.registerToken(tokenData.data);

      return tokenData.data;
    } catch (error) {
      logger.error('Error getting push token', { error: String(error) });
      return null;
    }
  }

  /**
   * Register push token with backend
   */
  async registerToken(token: string): Promise<void> {
    try {
      await api.post('/notifications/register', {
        token,
        platform: Platform.OS,
        deviceId: Device.deviceName,
      });
    } catch (error) {
      logger.error('Failed to register token', { error: String(error) });
    }
  }

  /**
   * Get notifications from backend
   */
  async getNotifications(page: number = 1): Promise<unknown[]> {
    try {
      const response = await api.get('/notifications', { params: { page } });
      return response.data.notifications;
    } catch (error) {
      logger.error('Failed to get notifications', { error: String(error) });
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await api.put(`/notifications/${notificationId}/read`);
    } catch (error) {
      logger.error('Failed to mark as read', { notificationId, error: String(error) });
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await api.delete(`/notifications/${notificationId}`);
    } catch (error) {
      logger.error('Failed to delete notification', { notificationId, error: String(error) });
    }
  }

  /**
   * Send test notification (for development)
   */
  async sendTestNotification(): Promise<void> {
    try {
      await api.post('/notifications/send', {
        title: 'Test Notification',
        body: 'This is a test from BuzzLocal!',
        category: 'system',
      });
    } catch (error) {
      logger.error('Failed to send test notification', { error: String(error) });
    }
  }

  /**
   * Set up notification listeners
   */
  setupListeners(): void {
    // Notification received while app is foregrounded
    this.notificationListeners.push(
      Notifications.addNotificationReceivedListener((notification) => {
        logger.debug('Notification received', { title: notification.request.content.title });
        this.handleNotificationReceived(notification);
      })
    );

    // Notification tapped
    this.notificationListeners.push(
      Notifications.addNotificationResponseReceivedListener((response) => {
        logger.debug('Notification response received', { categoryId: response.notification.request.content.categoryIdentifier });
        this.handleNotificationResponse(response);
      })
    );
  }

  /**
   * Handle incoming notification
   */
  private handleNotificationReceived(notification: Notifications.Notification): void {
    const { data } = notification.request.content;
    logger.debug('Processing notification', { type: data?.type });

    // Update app state based on notification
    if (data?.type === 'new_post') {
      // Refresh feed
    } else if (data?.type === 'event_reminder') {
      // Update event status
    }
  }

  /**
   * Handle notification tap
   */
  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const { data, categoryIdentifier } = response.notification.request.content;

    // Navigate based on notification type
    switch (categoryIdentifier) {
      case 'event':
        // Navigate to event
        // router.push(`/event/${data.eventId}`);
        break;
      case 'community':
        // Navigate to community
        // router.push(`/community/${data.communityId}`);
        break;
      case 'post':
        // Navigate to post
        // router.push(`/post/${data.postId}`);
        break;
      case 'alert':
        // Navigate to alert location
        // router.push(`/map?lat=${data.lat}&lng=${data.lng}`);
        break;
      default:
        // Navigate to home
        break;
    }
  }

  /**
   * Schedule local notification
   */
  async scheduleLocalNotification(
    payload: NotificationPayload,
    trigger?: Notifications.NotificationTriggerInput | null
  ): Promise<string | null> {
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: payload.title,
          body: payload.body,
          data: payload.data,
          sound: 'default',
          categoryIdentifier: payload.category,
        },
        trigger: trigger ?? null,
      });

      return identifier;
    } catch (error) {
      logger.error('Failed to schedule notification', { error: String(error) });
      return null;
    }
  }

  /**
   * Send local notification immediately
   */
  async sendLocalNotification(payload: NotificationPayload): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: payload.title,
        body: payload.body,
        data: payload.data,
        sound: 'default',
        categoryIdentifier: payload.category,
      },
      trigger: null, // Send immediately
    });
  }

  /**
   * Cancel scheduled notification
   */
  async cancelNotification(identifier: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Set badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * Get badge count
   */
  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  /**
   * Clean up listeners
   */
  cleanup(): void {
    this.notificationListeners.forEach((listener) => listener.remove());
    this.notificationListeners = [];
  }

  /**
   * Schedule event reminder
   */
  async scheduleEventReminder(
    eventId: string,
    eventTitle: string,
    eventTime: Date
  ): Promise<string | null> {
    // Remind 1 hour before
    const reminderTime = new Date(eventTime.getTime() - 60 * 60 * 1000);

    if (reminderTime <= new Date()) {
      return null; // Event is too soon
    }

    return this.scheduleLocalNotification(
      {
        title: `⏰ Event starting soon!`,
        body: `${eventTitle} starts in 1 hour`,
        data: { eventId, type: 'event_reminder' },
        category: 'event',
      },
      {
        type: 'date' as const,
        date: reminderTime.getTime(),
      } as Notifications.NotificationTriggerInput
    );
  }

  /**
   * Schedule daily digest
   */
  async scheduleDailyDigest(): Promise<string | null> {
    // Schedule for 9 AM daily
    const now = new Date();
    const scheduleTime = new Date();
    scheduleTime.setHours(9, 0, 0, 0);

    if (scheduleTime <= now) {
      scheduleTime.setDate(scheduleTime.getDate() + 1);
    }

    return this.scheduleLocalNotification(
      {
        title: `☀️ Good morning!`,
        body: 'See what\'s trending in your area today',
        data: { type: 'daily_digest' },
        category: 'system',
      },
      {
        type: 'date' as const,
        date: scheduleTime.getTime(),
      } as Notifications.NotificationTriggerInput
    );
  }
}

export const notificationService = new NotificationService();
