import { z } from 'zod';

export interface Event {
  id: string;
  title: string;
  description: string;
  organizerId: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  startDate: Date;
  endDate: Date;
  coverImage?: string;
  category: 'music' | 'sports' | 'food' | 'tech' | 'art' | 'community' | 'other';
  isPublic: boolean;
  capacity: number;
  ticketPrice: number;
  ticketsSold: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Ticket {
  id: string;
  eventId: string;
  userId: string;
  ticketNumber: string;
  status: 'valid' | 'used' | 'cancelled' | 'refunded';
  purchasedAt: Date;
  checkedInAt?: Date;
}

export interface RSVP {
  id: string;
  eventId: string;
  userId: string;
  status: 'going' | 'maybe' | 'not_going';
  createdAt: Date;
}

export const CreateEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000),
  organizerId: z.string().uuid(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string(),
  }),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  coverImage: z.string().url().optional(),
  category: z.enum(['music', 'sports', 'food', 'tech', 'art', 'community', 'other']),
  isPublic: z.boolean().default(true),
  capacity: z.number().min(1),
  ticketPrice: z.number().min(0).default(0),
});

export type CreateEventInput = z.infer<typeof CreateEventSchema>;

export const RSVPEventSchema = z.object({
  eventId: z.string().uuid(),
  userId: z.string().uuid(),
  status: z.enum(['going', 'maybe', 'not_going']),
});

export type RSVPEventInput = z.infer<typeof RSVPEventSchema>;

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