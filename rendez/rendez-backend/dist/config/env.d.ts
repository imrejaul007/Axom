export declare const env: {
    NODE_ENV: string;
    PORT: number;
    DATABASE_URL: string;
    REDIS_URL: string;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    REZ: {
        API_URL: string;
        API_KEY: string;
        WEBHOOK_SECRET: string;
    };
    CLOUDINARY: {
        CLOUD_NAME: string;
        API_KEY: string;
        API_SECRET: string;
    };
    FRAUD: {
        MAX_GIFTS_PER_DAY: number;
        GIFT_EXPIRY_HOURS: number;
        MATCH_EXPIRY_HOURS: number;
        REWARD_COOLDOWN_DAYS: number;
    };
    GIFT_CATALOG_CACHE_TTL: number;
    ALLOWED_ORIGINS: string[];
};
//# sourceMappingURL=env.d.ts.map