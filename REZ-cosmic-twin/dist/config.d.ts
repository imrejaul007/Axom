import { z } from "zod";
/**
 * Zod schema for environment configuration.
 * Validates required and optional environment variables on startup.
 */
declare const envSchema: z.ZodObject<{
    /** Port the service listens on. Defaults to 4055. */
    PORT: z.ZodDefault<z.ZodNumber>;
    /** Runtime environment. Defaults to "development". */
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "test", "production"]>>;
    /** MongoDB connection URI. Required for production persistence. */
    MONGODB_URI: z.ZodOptional<z.ZodString>;
    /** Redis host for caching layer. */
    REDIS_HOST: z.ZodDefault<z.ZodString>;
    /** Redis port number. */
    REDIS_PORT: z.ZodDefault<z.ZodNumber>;
    /**
     * Bearer token for internal service authentication.
     * Required in production; empty string is allowed for local development.
     */
    INTERNAL_SERVICE_TOKEN: z.ZodOptional<z.ZodString>;
    /** Base URL of the Trust OS service. */
    TRUST_OS_URL: z.ZodDefault<z.ZodString>;
    /** Base URL of the Memory Engine service. */
    MEMORY_ENGINE_URL: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    PORT: number;
    NODE_ENV: "development" | "test" | "production";
    REDIS_HOST: string;
    REDIS_PORT: number;
    TRUST_OS_URL: string;
    MEMORY_ENGINE_URL: string;
    MONGODB_URI?: string | undefined;
    INTERNAL_SERVICE_TOKEN?: string | undefined;
}, {
    PORT?: number | undefined;
    NODE_ENV?: "development" | "test" | "production" | undefined;
    MONGODB_URI?: string | undefined;
    REDIS_HOST?: string | undefined;
    REDIS_PORT?: number | undefined;
    INTERNAL_SERVICE_TOKEN?: string | undefined;
    TRUST_OS_URL?: string | undefined;
    MEMORY_ENGINE_URL?: string | undefined;
}>;
/**
 * Validated application configuration derived from environment variables.
 *
 * All properties are typed and validated at module load time.
 * A Zod validation error at startup is intentional — misconfiguration
 * should fail fast rather than cause subtle runtime bugs.
 */
export type AppConfig = z.infer<typeof envSchema>;
/**
 * Validated singleton config instance.
 * Import this anywhere you need access to config values.
 *
 * @example
 * import { config } from "../config";
 * const port = config.PORT;
 */
export declare const config: AppConfig;
export {};
//# sourceMappingURL=config.d.ts.map