import { z } from 'zod';

// Content Analysis Types
export interface ContentAnalysisResult {
  contentId: string;
  userId: string;
  moderation: ModerationResult;
  sentiment: SentimentResult;
  spam: SpamResult;
  toxicity: ToxicityResult;
  flagged: boolean;
  createdAt: Date;
}

export interface ModerationResult {
  passed: boolean;
  categories: ModerationCategory[];
  confidence: number;
  action?: 'allow' | 'warn' | 'block';
}

export interface ModerationCategory {
  category: string;
  confidence: number;
  matched: boolean;
}

export interface SentimentResult {
  score: number; // -1 to 1
  label: 'positive' | 'negative' | 'neutral';
  confidence: number;
  emotions: EmotionScores;
}

export interface EmotionScores {
  joy: number;
  anger: number;
  sadness: number;
  fear: number;
  surprise: number;
}

export interface SpamResult {
  isSpam: boolean;
  score: number;
  reasons: string[];
  confidence: number;
}

export interface ToxicityResult {
  isToxic: boolean;
  score: number;
  categories: ToxicityCategory[];
  confidence: number;
}

export interface ToxicityCategory {
  type: string;
  score: number;
}

// API Request/Response Types
export const AnalyzeContentSchema = z.object({
  contentId: z.string().uuid(),
  userId: z.string().uuid(),
  text: z.string().min(1).max(10000),
  context: z.enum(['post', 'comment', 'message', 'profile']).optional(),
});

export type AnalyzeContentInput = z.infer<typeof AnalyzeContentSchema>;

export const BatchAnalyzeSchema = z.object({
  items: z.array(AnalyzeContentSchema).min(1).max(100),
});

export type BatchAnalyzeInput = z.infer<typeof BatchAnalyzeSchema>;

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// Health Check
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  dependencies: {
    mongodb: 'connected' | 'disconnected';
    redis: 'connected' | 'disconnected';
  };
}