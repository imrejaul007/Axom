import { z } from "zod";
/**
 * Zod schema for environment configuration.
 * Validates required and optional environment variables on startup.
 */
const envSchema = z.object({
    /** Port the service listens on. Defaults to 4055. */
    PORT: z.coerce.number().int().positive().default(4055),
    /** Runtime environment. Defaults to "development". */
    NODE_ENV: z
        .enum(["development", "test", "production"])
        .default("development"),
    /** MongoDB connection URI. Required for production persistence. */
    MONGODB_URI: z.string().url().optional(),
    /** Redis host for caching layer. */
    REDIS_HOST: z.string().default("localhost"),
    /** Redis port number. */
    REDIS_PORT: z.coerce.number().int().positive().default(6379),
    /**
     * Bearer token for internal service authentication.
     * Required in production; empty string is allowed for local development.
     */
    INTERNAL_SERVICE_TOKEN: z.string().optional(),
    /** Base URL of the Trust OS service. */
    TRUST_OS_URL: z.string().url().default("http://localhost:4050"),
    /** Base URL of the Memory Engine service. */
    MEMORY_ENGINE_URL: z.string().url().default("http://localhost:4054"),
});
/**
 * Validated singleton config instance.
 * Import this anywhere you need access to config values.
 *
 * @example
 * import { config } from "../config";
 * const port = config.PORT;
 */
export const config = envSchema.parse(process.env);
//# sourceMappingURL=config.js.map