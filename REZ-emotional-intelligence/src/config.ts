import { z } from 'zod';

/**
 * Environment variable schema validated with Zod.
 */
const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4051),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().url().optional().default('mongodb://localhost:27017/rez-emotional-intel'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  INTERNAL_SERVICE_TOKEN: z.string().optional(),
  TRUST_OS_URL: z.string().url().default('http://localhost:4050'),
});

/**
 * Parsed and validated application configuration.
 * @typedef {z.infer<typeof envSchema>} AppConfig
 */
export type AppConfig = z.infer<typeof envSchema>;

/**
 * Validated application configuration derived from environment variables.
 * @type {AppConfig}
 */
export const config: AppConfig = envSchema.parse(process.env);

export default config;
