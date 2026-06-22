/**
 * REZ Trust OS - Configuration
 * @module config
 */

import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('4050'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/rez-trust-os'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379'),
  INTERNAL_SERVICE_TOKEN: z.string().optional(),
  EMOTIONAL_INTELLIGENCE_URL: z.string().default('http://localhost:4051'),
  HUMAN_CONTEXT_GRAPH_URL: z.string().default('http://localhost:4052'),
  LIFE_PATTERN_ENGINE_URL: z.string().default('http://localhost:4053'),
  MEMORY_ENGINE_URL: z.string().default('http://localhost:4054'),
  COSMIC_TWIN_URL: z.string().default('http://localhost:4055'),
  COMPLIANCE_GATEWAY_URL: z.string().default('http://localhost:4182'),
  AUDIT_TRAIL_URL: z.string().default('http://localhost:4185'),
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = {
  port: parseInt(parsed.data.PORT, 10),
  nodeEnv: parsed.data.NODE_ENV,
  mongodb: {
    uri: parsed.data.MONGODB_URI,
  },
  redis: {
    host: parsed.data.REDIS_HOST,
    port: parseInt(parsed.data.REDIS_PORT, 10),
  },
  internalServiceToken: parsed.data.INTERNAL_SERVICE_TOKEN,
  services: {
    emotionalIntelligence: parsed.data.EMOTIONAL_INTELLIGENCE_URL,
    humanContextGraph: parsed.data.HUMAN_CONTEXT_GRAPH_URL,
    lifePatternEngine: parsed.data.LIFE_PATTERN_ENGINE_URL,
    memoryEngine: parsed.data.MEMORY_ENGINE_URL,
    cosmicTwin: parsed.data.COSMIC_TWIN_URL,
    complianceGateway: parsed.data.COMPLIANCE_GATEWAY_URL,
    auditTrail: parsed.data.AUDIT_TRAIL_URL,
  },
  rateLimit: {
    windowMs: parseInt(parsed.data.RATE_LIMIT_WINDOW_MS, 10),
    maxRequests: parseInt(parsed.data.RATE_LIMIT_MAX_REQUESTS, 10),
  },
};

export const isProduction = config.nodeEnv === 'production';
export const isDevelopment = config.nodeEnv === 'development';