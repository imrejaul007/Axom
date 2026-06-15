/**
 * Application configuration with Zod validation
 * @module config
 */

import 'dotenv/config';
import { z } from 'zod';
import type { AppConfig } from './types.js';

/**
 * Environment variable schema with validation
 */
const envSchema = z.object({
  PORT: z.string().default('4056').transform(val => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/rez-life-story'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379').transform(val => parseInt(val, 10)),
  INTERNAL_SERVICE_TOKEN: z.string().default(''),
  TRUST_OS_URL: z.string().default('http://localhost:4050'),
  MEMORY_ENGINE_URL: z.string().default('http://localhost:4054'),
  PATTERN_ENGINE_URL: z.string().default('http://localhost:4053'),
});

/**
 * Validated application configuration
 */
let config: AppConfig;

try {
  const rawConfig = envSchema.parse(process.env);
  config = {
    port: rawConfig.PORT,
    nodeEnv: rawConfig.NODE_ENV,
    mongodbUri: rawConfig.MONGODB_URI,
    redisHost: rawConfig.REDIS_HOST,
    redisPort: rawConfig.REDIS_PORT,
    internalServiceToken: rawConfig.INTERNAL_SERVICE_TOKEN,
    trustOsUrl: rawConfig.TRUST_OS_URL,
    memoryEngineUrl: rawConfig.MEMORY_ENGINE_URL,
    patternEngineUrl: rawConfig.PATTERN_ENGINE_URL,
  };
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('Configuration validation failed:', error.errors);
    process.exit(1);
  }
  throw error;
}

export { config };
