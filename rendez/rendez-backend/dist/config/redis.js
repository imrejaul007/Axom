"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
const ioredis_1 = require("ioredis");
const env_1 = require("./env");
const telemetry_1 = require("./telemetry");
exports.redis = new ioredis_1.Redis(env_1.env.REDIS_URL, {
    // Required for Socket.io Redis adapter: must be null so Socket.io can manage its own Redis connections
    maxRetriesPerRequest: null,
    // Lazy connect defers connection until first use
    lazyConnect: true,
    retryStrategy: (times) => {
        if (times > 3) {
            telemetry_1.log.warn('[Redis] Max retries reached, Socket.io adapter will fail gracefully');
            return null;
        }
        return Math.min(times * 50, 2000);
    },
});
exports.redis.on('error', (err) => telemetry_1.log.error({ err }, '[Redis] Error'));
exports.redis.on('connect', () => telemetry_1.log.info('[Redis] Connected'));
