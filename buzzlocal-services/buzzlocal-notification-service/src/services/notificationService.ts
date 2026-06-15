import axios from 'axios';
import { PushToken, Notification } from '../models/index.js';

const EXPO_API_URL = 'https://exp.host/--/api/v2/push';

interface SendNotificationData {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  type?: 'post' | 'event' | 'community' | 'alert' | 'reward' | 'system';
}

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | 'none';
  badge?: number;
  categoryId?: string;
}

export class NotificationService {
  /**
   * Register a push token for a user
   */
  async registerToken(
    userId: string,
    token: string,
    platform: 'expo' | 'ios' | 'android',
    deviceId?: string
  ): Promise<{ success: boolean }> {
    // Deactivate old tokens for this user/device
    await PushToken.updateMany(
      { userId, deviceId },
      { isActive: false }
    );

    // Upsert new token
    await PushToken.findOneAndUpdate(
      { token },
      {
        userId,
        token,
        platform,
        deviceId,
        isActive: true,
        lastUsed: new Date(),
      },
      { upsert: true, new: true }
    );

    return { success: true };
  }

  /**
   * Send notification to a user
   */
  async sendToUser(data: SendNotificationData): Promise<{ success: boolean; delivered: number }> {
    const { userId, title, body, data: notificationData, type } = data;

    // Get user's active tokens
    const tokens = await PushToken.find({
      userId,
      isActive: true,
    });

    if (tokens.length === 0) {
      return { success: false, delivered: 0 };
    }

    // Save notification to database
    const notification = new Notification({
      userId,
      type: type || 'system',
      title,
      body,
      data: notificationData,
      isDelivered: false,
    });

    // Send push notifications
    const messages: ExpoPushMessage[] = tokens.map((t) => ({
      to: t.token,
      title,
      body,
      data: {
        ...notificationData,
        notificationId: notification._id.toString(),
      },
      sound: 'default',
      categoryId: type,
    }));

    let delivered = 0;

    try {
      const response = await axios.post(EXPO_API_URL, messages, {
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.EXPO_ACCESS_TOKEN && {
            Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}`,
          }),
        },
        timeout: 10000,
      });

      // Check delivery receipts
      if (response.data?.data) {
        response.data.data.forEach((receipt) => {
          if (receipt.status === 'ok') {
            delivered++;
          } else {
            console.error('Push failed:', receipt.message);
          }
        });
      }

      notification.isDelivered = delivered > 0;
      notification.sentAt = new Date();
      if (delivered > 0) {
        notification.deliveredAt = new Date();
      }
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }

    await notification.save();

    return { success: delivered > 0, delivered };
  }

  /**
   * Send to multiple users
   */
  async sendBulk(
    userIds: string[],
    data: Omit<SendNotificationData, 'userId'>
  ): Promise<{ success: boolean; totalDelivered: number }> {
    let totalDelivered = 0;

    for (const userId of userIds) {
      const result = await this.sendToUser({ userId, ...data });
      totalDelivered += result.delivered;
    }

    return { success: totalDelivered > 0, totalDelivered };
  }

  /**
   * Get user's notifications
   */
  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ notifications: unknown[]; unreadCount: number }> {
    const skip = (page - 1) * limit;

    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments({ userId, isRead: false }),
    ]);

    return {
      notifications: notifications.map((n) => ({
        id: n._id.toString(),
        type: n.type,
        title: n.title,
        body: n.body,
        data: n.data,
        isRead: n.isRead,
        createdAt: n.createdAt,
      })),
      unreadCount,
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true }
    );
  }

  /**
   * Mark all as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return Notification.countDocuments({ userId, isRead: false });
  }
}

export const notificationService = new NotificationService();
