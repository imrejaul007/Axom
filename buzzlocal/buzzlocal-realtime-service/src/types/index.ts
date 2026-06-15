import { z } from 'zod';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'location';
  mediaUrl?: string;
  read: boolean;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Presence {
  userId: string;
  status: 'online' | 'offline' | 'away';
  lastSeen: Date;
}

export const SendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  senderId: z.string().uuid(),
  content: z.string().min(1).max(5000),
  type: z.enum(['text', 'image', 'video', 'location']).default('text'),
  mediaUrl: z.string().url().optional(),
});

export type SendMessageInput = z.infer<typeof SendMessageSchema>;

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  connections: number;
  dependencies: { mongodb: 'connected' | 'disconnected'; redis: 'connected' | 'disconnected' };
}