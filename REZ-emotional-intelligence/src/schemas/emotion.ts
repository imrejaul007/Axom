import { z } from 'zod';
import { EmotionType } from '../types.js';

/**
 * Zod schema for emotion scores in a recording request.
 * Each emotion maps to a number between 0 and 1.
 */
export const emotionScoreSchema = z.record(z.coerce.number().min(0).max(1));

/**
 * Zod schema for a single emotion record request body.
 */
export const emotionRecordSchema = z.object({
  userId: z.string().min(1),
  emotions: emotionScoreSchema,
  intensity: z.coerce.number().int().min(1).max(10),
  triggers: z.array(z.string()).optional().default([]),
  context: z.string().optional().default(''),
  source: z.string().optional().default('api'),
});

/**
 * Zod schema for trend query parameters.
 */
export const trendQuerySchema = z.object({
  hours: z.coerce.number().int().min(1).max(8760).optional().default(24),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
});

export { EmotionType } from '../types.js';
