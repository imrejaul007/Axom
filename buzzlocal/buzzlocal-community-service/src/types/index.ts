import { z } from 'zod';

// Community Types
export interface Community {
  id: string;
  name: string;
  description: string;
  icon: string;
  coverImage?: string;
  ownerId: string;
  moderators: string[];
  createdAt: Date;
  updatedAt: Date;
  memberCount: number;
  isPrivate: boolean;
  isActive: boolean;
}

export interface CommunityMember {
  id: string;
  communityId: string;
  userId: string;
  role: 'admin' | 'moderator' | 'member';
  joinedAt: Date;
  lastActiveAt: Date;
  status: 'active' | 'banned' | 'left';
  karma: number;
}

export interface ActivityLog {
  id: string;
  communityId: string;
  userId: string;
  action: string;
  details: Record<string, unknown>;
  createdAt: Date;
}

// API Schemas
export const CreateCommunitySchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(1000).optional(),
  icon: z.string().url().optional(),
  coverImage: z.string().url().optional(),
  ownerId: z.string().uuid(),
  isPrivate: z.boolean().default(false),
});

export type CreateCommunityInput = z.infer<typeof CreateCommunitySchema>;

export const UpdateCommunitySchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(1000).optional(),
  icon: z.string().url().optional(),
  coverImage: z.string().url().optional(),
  isPrivate: z.boolean().optional(),
});

export type UpdateCommunityInput = z.infer<typeof UpdateCommunitySchema>;

export const AddMemberSchema = z.object({
  communityId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(['admin', 'moderator', 'member']).default('member'),
});

export type AddMemberInput = z.infer<typeof AddMemberSchema>;

export const UpdateMemberRoleSchema = z.object({
  communityId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(['admin', 'moderator', 'member']),
});

export type UpdateMemberRoleInput = z.infer<typeof UpdateMemberRoleSchema>;

export const RemoveMemberSchema = z.object({
  communityId: z.string().uuid(),
  userId: z.string().uuid(),
  reason: z.string().optional(),
});

export type RemoveMemberInput = z.infer<typeof RemoveMemberSchema>;

export const GetCommunitySchema = z.object({
  communityId: z.string().uuid(),
  includeMembers: z.boolean().default(false),
  includeActivities: z.boolean().default(false),
});

export type GetCommunityInput = z.infer<typeof GetCommunitySchema>;

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
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