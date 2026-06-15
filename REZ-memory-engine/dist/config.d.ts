/**
 * Validated application configuration loaded from environment variables.
 */
declare class Config {
    /** Server port */
    readonly port: number;
    /** Runtime environment */
    readonly nodeEnv: string;
    /** MongoDB connection URI (optional -- persistence layer TBD) */
    readonly mongodbUri: string;
    /** Redis host for caching layer */
    readonly redisHost: string;
    /** Redis port */
    readonly redisPort: number;
    /** Token for authenticating internal service requests */
    readonly internalServiceToken: string | undefined;
    constructor();
    /**
     * Whether the application is running in production.
     */
    get isProduction(): boolean;
}
/**
 * Singleton config instance.
 */
export declare const config: Config;
export {};
//# sourceMappingURL=config.d.ts.map