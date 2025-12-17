import { logger } from './logger';
import type { CacheAdapter } from './cacheInterface';
import { MemoryCache } from './cache';
import { CloudflareKVCache } from './cloudflareKVCache';
import type { KVNamespace } from '@cloudflare/workers-types';

export interface WorkerCacheOptions {
  backend?: 'memory' | 'kv';
  ttlMs?: number;
  staleTtlMs?: number;
  maxItems?: number;
}

export function createCache<T>(
  name: string = 'default',
  kvNamespace?: KVNamespace,
  options: WorkerCacheOptions = {}
): CacheAdapter<T> {
  const backend = options.backend ?? 'memory';
  const ttl = options.ttlMs ?? 5 * 60 * 1000;
  const staleTtl = options.staleTtlMs ?? 30 * 60 * 1000;
  const maxItems = options.maxItems ?? 500;

  if (backend === 'kv' && kvNamespace) {
    logger.info({ name, backend: 'cloudflare-kv' }, 'Creating Cloudflare KV cache');
    return new CloudflareKVCache<T>(kvNamespace, ttl, staleTtl);
  }

  if (backend === 'kv' && !kvNamespace) {
    logger.warn({ name }, 'KV backend requested but no namespace provided, falling back to memory');
  }

  logger.info({ name, backend: 'memory' }, 'Creating memory cache');
  return new MemoryCache<T>(ttl, maxItems, staleTtl);
}
