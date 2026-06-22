import { z } from 'zod';

export interface Notification {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'system' | 'alert';
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read: boolean;
  readAt?: Date;
  createdAt: Date;
}

export interface NotificationPreference {
  userId: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
  types: {
    like: boolean;
    comment: boolean;
    follow: boolean;
    mention: boolean;
    system: boolean;
    alert: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

export const SendNotificationSchema = z.object({
  userId: z.string().uuid(),
  type: z.enum(['like', 'comment', 'follow', 'mention', 'system', 'alert']),
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(500),
  data: z.record(z.unknown()).optional(),
});

export type SendNotificationInput = z.infer<typeof SendNotificationSchema>;

export const UpdatePreferencesSchema = z.object({
  pushEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  types: z.object({
    like: z.boolean().optional(),
    comment: z.boolean().optional(),
    follow: z.boolean().optional(),
    mention: z.boolean().optional(),
    system: z.boolean().optional(),
    alert: z.boolean().optional(),
  }).optional(),
  quietHours: z.object({
    enabled: z.boolean().optional(),
    start: z.string().optional(),
    end: z.string().optional(),
  }).optional(),
});

export type UpdatePreferencesInput = z.infer<typeof UpdatePreferencesSchema>;

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  dependencies: {
    mongodb: 'connected' | 'disconnected';
    redis: 'connected' | 'disconnected';
  };
}