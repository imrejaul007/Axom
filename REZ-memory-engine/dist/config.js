import dotenv from "dotenv";
import { z } from "zod";
/**
 * Validated application configuration loaded from environment variables.
 */
class Config {
    /** Server port */
    port;
    /** Runtime environment */
    nodeEnv;
    /** MongoDB connection URI (optional -- persistence layer TBD) */
    mongodbUri;
    /** Redis host for caching layer */
    redisHost;
    /** Redis port */
    redisPort;
    /** Token for authenticating internal service requests */
    internalServiceToken;
    constructor() {
        dotenv.config();
        const schema = z.object({
            PORT: z.coerce.number().default(4054),
            NODE_ENV: z.string().default("development"),
            MONGODB_URI: z.string().default("mongodb://localhost:27017/rez-memory"),
            REDIS_HOST: z.string().default("localhost"),
            REDIS_PORT: z.coerce.number().default(6379),
            INTERNAL_SERVICE_TOKEN: z.string().optional(),
        });
        const parsed = schema.safeParse(process.env);
        if (!parsed.success) {
            throw new Error(`Invalid configuration: ${parsed.error.message}`);
        }
        const env = parsed.data;
        this.port = env.PORT;
        this.nodeEnv = env.NODE_ENV;
        this.mongodbUri = env.MONGODB_URI;
        this.redisHost = env.REDIS_HOST;
        this.redisPort = env.REDIS_PORT;
        this.internalServiceToken = env.INTERNAL_SERVICE_TOKEN;
    }
    /**
     * Whether the application is running in production.
     */
    get isProduction() {
        return this.nodeEnv === "production";
    }
}
/**
 * Singleton config instance.
 */
export const config = new Config();
//# sourceMappingURL=config.js.map