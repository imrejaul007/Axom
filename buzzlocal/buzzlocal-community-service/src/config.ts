import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4004', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/buzzlocal-community',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },

  // RABTUL Services Integration (ADDED)
  services: {
    auth: {
      url: process.env.RABTUL_AUTH_URL || 'http://localhost:4002',
      internalToken: process.env.INTERNAL_SERVICE_TOKEN || 'your-internal-token',
    },
    wallet: {
      url: process.env.RABTUL_WALLET_URL || 'http://localhost:4004',
      internalToken: process.env.INTERNAL_SERVICE_TOKEN || 'your-internal-token',
    },
    payment: {
      url: process.env.RABTUL_PAYMENT_URL || 'http://localhost:4001',
      internalToken: process.env.INTERNAL_SERVICE_TOKEN || 'your-internal-token',
    },
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  community: {
    maxMembers: parseInt(process.env.MAX_COMMUNITY_MEMBERS || '5000', 10),
    maxNameLength: 100,
    maxDescriptionLength: 1000,
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },
};