/**
 * Redis Cache Adapter
 * Implements CacheAdapter using Redis for distributed caching
 */

import Redis from 'ioredis';
import type { CacheAdapter, CacheEntry } from './cacheInterface';
import { logger } from './logger';

export class RedisCache<T = unknown> implements CacheAdapter<T> {
  private client: Redis;
  private readonly defaultTtl: number;
  private readonly defaultStaleTtl: number;

  constructor(redisUrl: string, defaultTtlMs: number = 300000, defaultStaleTtlMs: number = 1800000) {
    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      lazyConnect: true,
    });

    this.defaultTtl = defaultTtlMs;
    this.defaultStaleTtl = defaultStaleTtlMs;

    this.client.on('error', error => {
      logger.error({ err: error }, 'Redis connection error');
    });

    this.client.on('connect', () => {
      logger.info('Redis cache connected');
    });

    // Connect asynchronously
    this.client.connect().catch(error => {
      logger.error({ err: error }, 'Failed to connect to Redis');
    });
  }

  async get(key: string): Promise<CacheEntry<T> | null> {
    try {
      const value = await this.client.get(key);
      if (!value) {
        return null;
      }

      const entry = JSON.parse(value) as CacheEntry<T>;

      // Check expiration
      if (entry.expiresAt < Date.now()) {
        await this.delete(key);
        return null;
      }

      return entry;
    } catch (error) {
      logger.warn({ err: error, key }, 'Redis get failed');
      return null;
    }
  }

  async getWithStale(key: string): Promise<{ entry: CacheEntry<T> | null; isStale: boolean }> {
    try {
      const value = await this.client.get(key);
      if (!value) {
        return { entry: null, isStale: false };
      }

      const entry = JSON.parse(value) as CacheEntry<T>;
      const now = Date.now();

      // Completely expired beyond stale window
      if (entry.expiresAt < now) {
        await this.delete(key);
        return { entry: null, isStale: false };
      }

      // Check if stale (fresh TTL expired but within stale window)
      const isStale = entry.staleAt < now;
      return { entry, isStale };
    } catch (error) {
      logger.warn({ err: error, key }, 'Redis getWithStale failed');
      return { entry: null, isStale: false };
    }
  }

  async set(key: string, value: T, ttlMs?: number, staleTtlMs?: number): Promise<void> {
    try {
      const freshTtl = ttlMs ?? this.defaultTtl;
      const staleWindow = staleTtlMs ?? this.defaultStaleTtl;
      const now = Date.now();

      const entry: CacheEntry<T> = {
        data: value,
        staleAt: now + freshTtl,
        expiresAt: now + staleWindow,
      };

      // Set with stale window expiration in seconds
      await this.client.setex(key, Math.ceil(staleWindow / 1000), JSON.stringify(entry));
    } catch (error) {
      logger.warn({ err: error, key }, 'Redis set failed');
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      logger.warn({ err: error, key }, 'Redis delete failed');
    }
  }

  async clear(): Promise<void> {
    try {
      await this.client.flushdb();
    } catch (error) {
      logger.warn({ err: error }, 'Redis clear failed');
    }
  }

  async size(): Promise<number> {
    try {
      return await this.client.dbsize();
    } catch (error) {
      logger.warn({ err: error }, 'Redis size failed');
      return 0;
    }
  }

  /**
   * Close Redis connection
   */
  async disconnect(): Promise<void> {
    await this.client.quit();
  }
}
