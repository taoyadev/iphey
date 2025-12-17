/**
 * Cloudflare Workers KV Cache Adapter
 * Optimized for edge caching with global distribution
 */

import type { CacheAdapter, CacheEntry } from './cacheInterface';
import { logger } from './logger';
import type { KVNamespace } from '@cloudflare/workers-types';

export class CloudflareKVCache<T = unknown> implements CacheAdapter<T> {
  private kv: KVNamespace;
  private readonly defaultTtl: number;
  private readonly defaultStaleTtl: number;

  /**
   * @param kv - KV namespace binding from Cloudflare Workers environment
   * @param defaultTtlMs - Fresh TTL in milliseconds (default: 5 minutes)
   * @param defaultStaleTtlMs - Stale window in milliseconds (default: 30 minutes)
   */
  constructor(kv: KVNamespace, defaultTtlMs: number = 300000, defaultStaleTtlMs: number = 1800000) {
    this.kv = kv;
    this.defaultTtl = defaultTtlMs;
    this.defaultStaleTtl = defaultStaleTtlMs;
  }

  async get(key: string): Promise<CacheEntry<T> | null> {
    try {
      const value = await this.kv.get(key, { type: 'json' });
      if (!value) {
        return null;
      }

      const entry = value as CacheEntry<T>;

      // Check expiration (KV auto-deletes, but double-check)
      if (entry.expiresAt < Date.now()) {
        await this.delete(key);
        return null;
      }

      return entry;
    } catch (error) {
      logger.warn({ err: error, key }, 'Cloudflare KV get failed');
      return null;
    }
  }

  async getWithStale(key: string): Promise<{ entry: CacheEntry<T> | null; isStale: boolean }> {
    try {
      const value = await this.kv.get(key, { type: 'json' });
      if (!value) {
        return { entry: null, isStale: false };
      }

      const entry = value as CacheEntry<T>;
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
      logger.warn({ err: error, key }, 'Cloudflare KV getWithStale failed');
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

      // KV expirationTtl is in seconds
      const expirationTtl = Math.ceil(staleWindow / 1000);

      await this.kv.put(key, JSON.stringify(entry), {
        expirationTtl,
        metadata: {
          staleAt: entry.staleAt,
          expiresAt: entry.expiresAt,
        },
      });
    } catch (error) {
      logger.warn({ err: error, key }, 'Cloudflare KV set failed');
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.kv.delete(key);
    } catch (error) {
      logger.warn({ err: error, key }, 'Cloudflare KV delete failed');
    }
  }

  async clear(): Promise<void> {
    try {
      // KV doesn't have a clear all operation
      // We need to list and delete keys
      logger.warn('KV clear() is expensive - lists and deletes all keys');

      let cursor: string | undefined;
      let totalDeleted = 0;

      do {
        const result = await this.kv.list({ cursor, limit: 1000 });

        // Delete in batches
        await Promise.all(result.keys.map(({ name }) => this.kv.delete(name)));

        totalDeleted += result.keys.length;
        cursor = result.list_complete ? undefined : result.cursor;
      } while (cursor);

      logger.info({ totalDeleted }, 'Cloudflare KV cleared');
    } catch (error) {
      logger.warn({ err: error }, 'Cloudflare KV clear failed');
    }
  }

  async size(): Promise<number> {
    try {
      // KV doesn't provide size directly, need to count
      let cursor: string | undefined;
      let count = 0;

      do {
        const result = await this.kv.list({ cursor, limit: 1000 });
        count += result.keys.length;
        cursor = result.list_complete ? undefined : result.cursor;
      } while (cursor);

      return count;
    } catch (error) {
      logger.warn({ err: error }, 'Cloudflare KV size failed');
      return 0;
    }
  }
}

/**
 * Factory function for Cloudflare Workers environment
 * Usage in Workers:
 *
 * export default {
 *   async fetch(request: Request, env: Env) {
 *     const cache = createCloudflareKVCache(env.IP_CACHE);
 *     // ... use cache
 *   }
 * }
 */
export function createCloudflareKVCache<T>(
  kvNamespace: KVNamespace,
  ttlMs: number = 300000,
  staleTtlMs: number = 1800000
): CacheAdapter<T> {
  return new CloudflareKVCache<T>(kvNamespace, ttlMs, staleTtlMs);
}
