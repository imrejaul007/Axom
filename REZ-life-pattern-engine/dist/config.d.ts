/**
 * REZ Life Pattern Engine - Configuration
 * Validates and exports environment configuration using Zod
 */
import "dotenv/config";
/**
 * Application configuration object
 */
export declare const config: {
    /** Server port */
    readonly port: number;
    /** Current environment */
    readonly nodeEnv: "development" | "production" | "test";
    /** MongoDB connection string */
    readonly mongodbUri: string;
    /** Redis host */
    readonly redis: {
        readonly host: string;
        readonly port: number;
    };
    /** Internal service token */
    readonly internalServiceToken: string | undefined;
    /** External service URLs */
    readonly services: {
        readonly trustOs: string;
        readonly memoryEngine: string;
    };
    /** Whether running in production */
    readonly isProduction: boolean;
    /** Whether running in development */
    readonly isDevelopment: boolean;
    /** Whether running in test mode */
    readonly isTest: boolean;
};
/**
 * Type representing the validated configuration
 */
export type Config = typeof config;
//# sourceMappingURL=config.d.ts.map