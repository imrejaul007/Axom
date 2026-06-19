import { Redis } from 'ioredis';
import { env } from './env';
import { log } from './telemetry';

export const redis = new Redis(env.REDIS_URL, {
  // Required for Socket.io Redis adapter: must be null so Socket.io can manage its own Redis connections
  maxRetriesPerRequest: null,
  // Lazy connect defers connection until first use
  lazyConnect: true,
  retryStrategy: (times) => {
    if (times > 3) {
      log.warn('[Redis] Max retries reached, Socket.io adapter will fail gracefully');
      return null;
    }
    return Math.min(times * 50, 2000);
  },
});

redis.on('error', (err) => log.error({ err }, '[Redis] Error'));
redis.on('connect', () => log.info('[Redis] Connected'));
