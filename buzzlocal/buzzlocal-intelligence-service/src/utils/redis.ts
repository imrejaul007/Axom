import Redis from 'ioredis';
import { config } from '../config.js';
import { logger } from './logger.js';

class RedisClient {
  private client: Redis | null = null;
  private isConnected = false;

  async connect(): Promise<void> {
    if (this.client && this.isConnected) {
      return;
    }

    try {
      this.client = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        retryStrategy: (times) => {
          if (times > 10) {
            logger.error('Redis connection failed after 10 retries');
            return null;
          }
          return Math.min(times * 100, 3000);
        },
        maxRetriesPerRequest: 3,
      });

      this.client.on('connect', () => {
        logger.info('Redis connected successfully');
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        logger.error('Redis connection error', { error: err.message });
        this.isConnected = false;
      });

      this.client.on('close', () => {
        logger.warn('Redis connection closed');
        this.isConnected = false;
      });

      // Test connection
      await this.client.ping();
      this.isConnected = true;
    } catch (error) {
      logger.error('Failed to connect to Redis', { error });
      this.isConnected = false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
      logger.info('Redis disconnected');
    }
  }

  getClient(): Redis {
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }
    return this.client;
  }

  isReady(): boolean {
    return this.isConnected && this.client !== null;
  }

  // Cache operations
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.isReady()) return;
    const client = this.getClient();
    if (ttlSeconds) {
      await client.setex(key, ttlSeconds, value);
    } else {
      await client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.isReady()) return null;
    return this.getClient().get(key);
  }

  async del(key: string): Promise<void> {
    if (!this.isReady()) return;
    await this.getClient().del(key);
  }

  async hset(key: string, field: string, value: string): Promise<void> {
    if (!this.isReady()) return;
    await this.getClient().hset(key, field, value);
  }

  async hget(key: string, field: string): Promise<string | null> {
    if (!this.isReady()) return null;
    return this.getClient().hget(key, field);
  }

  async incr(key: string): Promise<number> {
    if (!this.isReady()) return 0;
    return this.getClient().incr(key);
  }

  async expire(key: string, seconds: number): Promise<void> {
    if (!this.isReady()) return;
    await this.getClient().expire(key, seconds);
  }
}

export const redisClient = new RedisClient();