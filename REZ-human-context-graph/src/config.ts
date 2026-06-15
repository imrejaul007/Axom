/**
 * Configuration management with Zod validation.
 * @module config
 */

import 'dotenv/config';
import { z } from 'zod';

/**
 * Environment configuration schema validated by Zod.
 */
const envSchema = z.object({
  /** Server port number */
  PORT: z.string().default('4052'),
  /** Node environment (development, production, test) */
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  /** MongoDB connection URI */
  MONGODB_URI: z.string().default('mongodb://localhost:27017/rez-context-graph'),
  /** Redis host address */
  REDIS_HOST: z.string().default('localhost'),
  /** Redis port number */
  REDIS_PORT: z.string().default('6379'),
  /** Internal service authentication token */
  INTERNAL_SERVICE_TOKEN: z.string().optional(),
  /** Trust OS service URL */
  TRUST_OS_URL: z.string().default('http://localhost:4050'),
});

/**
 * Parsed and validated environment configuration.
 */
export interface Config {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  mongodbUri: string;
  redisHost: string;
  redisPort: number;
  internalServiceToken: string | undefined;
  trustOsUrl: string;
}

/**
 * Validates and parses environment variables.
 * Throws an error if required variables are missing or invalid.
 * @returns Validated configuration object
 */
export function getConfig(): Config {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
    throw new Error(`Invalid environment configuration:\n${errors.join('\n')}`);
  }

  const data = result.data;

  return {
    port: parseInt(data.PORT, 10),
    nodeEnv: data.NODE_ENV,
    mongodbUri: data.MONGODB_URI,
    redisHost: data.REDIS_HOST,
    redisPort: parseInt(data.REDIS_PORT, 10),
    internalServiceToken: data.INTERNAL_SERVICE_TOKEN,
    trustOsUrl: data.TRUST_OS_URL,
  };
}

/** Singleton config instance */
let configInstance: Config | null = null;

/**
 * Gets the configuration singleton, creating it if necessary.
 * @returns The validated configuration object
 */
export function getConfigSingleton(): Config {
  if (!configInstance) {
    configInstance = getConfig();
  }
  return configInstance;
}
