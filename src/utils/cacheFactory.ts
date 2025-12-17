/**
 * Cache Factory
 * Creates cache instances based on configuration
 */

import { config } from '../config';
import { logger } from './logger';
import type { CacheAdapter } from './cacheInterface';
import { MemoryCache } from './cache';
import { RedisCache } from './redisCache';
import { CloudflareKVCache } from './cloudflareKVCache';
import type { KVNamespace } from '@cloudflare/workers-types';

/**
 * Create cache instance based on configuration
 * @param name - Cache instance name for logging
 * @param kvNamespace - Optional KV namespace for Cloudflare Workers
 */
export function createCache<T>(name: string = 'default', kvNamespace?: KVNamespace): CacheAdapter<T> {
  const backend = config.CACHE_BACKEND;

  // Cloudflare KV (Workers environment)
  if (backend === 'kv' && kvNamespace) {
    logger.info({ name, backend: 'cloudflare-kv' }, 'Creating Cloudflare KV cache');
    return new CloudflareKVCache<T>(kvNamespace, config.CACHE_TTL_MS, config.CACHE_STALE_TTL_MS);
  }

  // Traditional Redis
  if (backend === 'redis' && config.REDIS_URL) {
    logger.info({ name, backend: 'redis' }, 'Creating Redis cache');
    return new RedisCache<T>(config.REDIS_URL, config.CACHE_TTL_MS, config.CACHE_STALE_TTL_MS);
  }

  // Fallback to in-memory cache
  logger.info({ name, backend: 'memory' }, 'Creating memory cache');
  return new MemoryCache<T>(config.CACHE_TTL_MS, config.CACHE_MAX_ITEMS, config.CACHE_STALE_TTL_MS);
}
