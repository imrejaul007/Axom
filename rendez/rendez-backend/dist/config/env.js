"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Validate required env vars at startup — fail fast before any DB/Redis connection
const REQUIRED = [
    'DATABASE_URL',
    'JWT_SECRET',
    'REZ_PARTNER_API_URL',
    'REZ_PARTNER_API_KEY',
    'REZ_WEBHOOK_SECRET',
];
for (const key of REQUIRED) {
    if (!process.env[key]) {
        throw new Error(`[Rendez] Missing required environment variable: ${key}`);
    }
}
// In production, REDIS_URL must be explicitly set — silence here would mean broken BullMQ
if (process.env.NODE_ENV === 'production' && !process.env.REDIS_URL) {
    console.error('[FATAL] REDIS_URL is not set in production — BullMQ and real-time features will fail');
    process.exit(1);
}
// In production, Cloudinary must also be configured
if (process.env.NODE_ENV === 'production') {
    const cloudinaryVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
    for (const key of cloudinaryVars) {
        if (!process.env[key]) {
            throw new Error(`[Rendez] Missing required production environment variable: ${key}`);
        }
    }
}
exports.env = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '4000', 10),
    DATABASE_URL: process.env.DATABASE_URL,
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    REZ: {
        API_URL: process.env.REZ_PARTNER_API_URL,
        API_KEY: process.env.REZ_PARTNER_API_KEY,
        WEBHOOK_SECRET: process.env.REZ_WEBHOOK_SECRET,
    },
    CLOUDINARY: {
        CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
        API_KEY: process.env.CLOUDINARY_API_KEY || '',
        API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
    },
    FRAUD: {
        MAX_GIFTS_PER_DAY: parseInt(process.env.MAX_GIFTS_PER_DAY || '5', 10),
        GIFT_EXPIRY_HOURS: parseInt(process.env.GIFT_EXPIRY_HOURS || '48', 10),
        MATCH_EXPIRY_HOURS: parseInt(process.env.MATCH_EXPIRY_HOURS || '72', 10),
        REWARD_COOLDOWN_DAYS: parseInt(process.env.REWARD_COOLDOWN_DAYS || '90', 10),
    },
    GIFT_CATALOG_CACHE_TTL: parseInt(process.env.GIFT_CATALOG_CACHE_TTL_SECONDS || '21600', 10),
    // CRIT-44-06 FIX: Restrict Socket.IO CORS to explicit allowlist. In production, only rendez.in
    // is allowed. In dev, also allow localhost. Set ALLOWED_ORIGINS env var to customize.
    ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS || 'https://rendez.in,http://localhost:*')
        .split(',')
        .map(s => s.trim()),
};
