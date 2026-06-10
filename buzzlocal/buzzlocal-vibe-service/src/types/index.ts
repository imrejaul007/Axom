import { z } from 'zod';

export interface Vibe {
  id: string;
  name: string;
  type: 'cafe' | 'restaurant' | 'park' | 'beach' | 'gym' | 'coworking' | 'other';
  latitude: number;
  longitude: number;
  address?: string;
  checkInCount: number;
  trending: boolean;
  createdAt: Date;
}

export interface CheckIn {
  id: string;
  vibeId: string;
  userId: string;
  note?: string;
  photoUrl?: string;
  createdAt: Date;
}

export interface HeatmapPoint {
  latitude: number;
  longitude: number;
  intensity: number;
}

export const CreateVibeSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['cafe', 'restaurant', 'park', 'beach', 'gym', 'coworking', 'other']),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().optional(),
});

export type CreateVibeInput = z.infer<typeof CreateVibeSchema>;

export const CheckInSchema = z.object({
  vibeId: z.string().uuid(),
  userId: z.string().uuid(),
  note: z.string().max(500).optional(),
  photoUrl: z.string().url().optional(),
});

export type CheckInInput = z.infer<typeof CheckInSchema>;

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  dependencies: { mongodb: 'connected' | 'disconnected'; redis: 'connected' | 'disconnected' };
}