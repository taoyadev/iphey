import { LRUCache } from 'lru-cache';
import type { CacheAdapter, CacheEntry } from './cacheInterface';

/**
 * Memory-based LRU Cache Adapter
 */
export class MemoryCache<T> implements CacheAdapter<T> {
  private cache: LRUCache<string, CacheEntry<T>>;
  private ttl: number;
  private staleTtl: number;

  constructor(ttlMs = 300000, maxSize = 500, staleTtlMs = 1800000) {
    this.ttl = ttlMs;
    this.staleTtl = staleTtlMs;
    this.cache = new LRUCache<string, CacheEntry<T>>({
      max: maxSize,
      ttl: staleTtlMs, // Use stale TTL for LRU eviction
    });
  }

  get(key: string): CacheEntry<T> | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    return entry;
  }

  getWithStale(key: string): { entry: CacheEntry<T> | null; isStale: boolean } {
    const entry = this.cache.get(key);
    if (!entry) {
      return { entry: null, isStale: false };
    }

    const now = Date.now();

    // Completely expired beyond stale window
    if (entry.expiresAt < now) {
      this.cache.delete(key);
      return { entry: null, isStale: false };
    }

    // Check if stale (fresh TTL expired but within stale window)
    const isStale = entry.staleAt < now;
    return { entry, isStale };
  }

  set(key: string, value: T, ttlMs?: number, staleTtlMs?: number): void {
    const freshTtl = ttlMs ?? this.ttl;
    const staleWindow = staleTtlMs ?? this.staleTtl;
    const now = Date.now();

    this.cache.set(key, {
      data: value,
      staleAt: now + freshTtl,
      expiresAt: now + staleWindow,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Backward compatibility alias
export class AppCache<T> extends MemoryCache<T> {}
