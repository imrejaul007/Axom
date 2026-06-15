import { z } from 'zod';

// Post Types
export interface Post {
  id: string;
  userId: string;
  content: string;
  media?: MediaItem[];
  location?: Location;
  communityId?: string;
  isAiGenerated: boolean;
  aiCard?: AICard;
  likes: number;
  comments: number;
  shares: number;
  engagement: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MediaItem {
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  width?: number;
  height?: number;
}

export interface Location {
  latitude: number;
  longitude: number;
  area?: string;
  city?: string;
}

export interface AICard {
  type: 'weather' | 'news' | 'trending' | 'tip' | 'event' | 'poll';
  title: string;
  description: string;
  data?: Record<string, unknown>;
  imageUrl?: string;
  actionUrl?: string;
}

// Feed Types
export interface Feed {
  id: string;
  userId: string;
  posts: Post[];
  cursor?: string;
  hasMore: boolean;
}

// API Schemas
export const CreatePostSchema = z.object({
  content: z.string().min(1).max(5000),
  media: z.array(z.object({
    type: z.enum(['image', 'video']),
    url: z.string().url(),
    thumbnail: z.string().url().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
  })).max(10).optional(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    area: z.string().optional(),
    city: z.string().optional(),
  }).optional(),
  communityId: z.string().uuid().optional(),
});

export type CreatePostInput = z.infer<typeof CreatePostSchema>;

export const UpdatePostSchema = z.object({
  content: z.string().min(1).max(5000).optional(),
  media: z.array(z.object({
    type: z.enum(['image', 'video']),
    url: z.string().url(),
    thumbnail: z.string().url().optional(),
  })).max(10).optional(),
});

export type UpdatePostInput = z.infer<typeof UpdatePostSchema>;

export const GetFeedSchema = z.object({
  type: z.enum(['home', 'following', 'community', 'nearby']).default('home'),
  communityId: z.string().uuid().optional(),
  limit: z.number().min(1).max(50).default(20),
  cursor: z.string().optional(),
});

export type GetFeedInput = z.infer<typeof GetFeedSchema>;

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
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