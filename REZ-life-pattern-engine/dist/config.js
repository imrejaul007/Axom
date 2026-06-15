/**
 * REZ Life Pattern Engine - Configuration
 * Validates and exports environment configuration using Zod
 */
import "dotenv/config";
import { z } from "zod";
/**
 * Environment configuration schema
 */
const envSchema = z.object({
    /** Server port */
    PORT: z
        .string()
        .default("4053")
        .transform((val) => parseInt(val, 10))
        .pipe(z.number().min(1).max(65535)),
    /** Node environment */
    NODE_ENV: z
        .enum(["development", "production", "test"])
        .default("development"),
    /** MongoDB connection URI */
    MONGODB_URI: z.string().default("mongodb://localhost:27017/rez-life-pattern"),
    /** Redis host */
    REDIS_HOST: z.string().default("localhost"),
    /** Redis port */
    REDIS_PORT: z
        .string()
        .default("6379")
        .transform((val) => parseInt(val, 10))
        .pipe(z.number().min(1).max(65535)),
    /** Internal service authentication token */
    INTERNAL_SERVICE_TOKEN: z.string().optional(),
    /** Trust OS service URL */
    TRUST_OS_URL: z
        .string()
        .url()
        .default("http://localhost:4050"),
    /** Memory Engine service URL */
    MEMORY_ENGINE_URL: z
        .string()
        .url()
        .default("http://localhost:4054"),
});
/**
 * Validated environment configuration
 * Throws an error if environment variables are invalid
 */
const parsedEnv = envSchema.safeParse(process.env);
if (!parsedEnv.success) {
    console.error("Invalid environment configuration:", parsedEnv.error.flatten().fieldErrors);
    throw new Error(`Environment configuration error: ${JSON.stringify(parsedEnv.error.flatten().fieldErrors)}`);
}
/**
 * Application configuration object
 */
export const config = {
    /** Server port */
    port: parsedEnv.data.PORT,
    /** Current environment */
    nodeEnv: parsedEnv.data.NODE_ENV,
    /** MongoDB connection string */
    mongodbUri: parsedEnv.data.MONGODB_URI,
    /** Redis host */
    redis: {
        host: parsedEnv.data.REDIS_HOST,
        port: parsedEnv.data.REDIS_PORT,
    },
    /** Internal service token */
    internalServiceToken: parsedEnv.data.INTERNAL_SERVICE_TOKEN,
    /** External service URLs */
    services: {
        trustOs: parsedEnv.data.TRUST_OS_URL,
        memoryEngine: parsedEnv.data.MEMORY_ENGINE_URL,
    },
    /** Whether running in production */
    isProduction: parsedEnv.data.NODE_ENV === "production",
    /** Whether running in development */
    isDevelopment: parsedEnv.data.NODE_ENV === "development",
    /** Whether running in test mode */
    isTest: parsedEnv.data.NODE_ENV === "test",
};
//# sourceMappingURL=config.js.map