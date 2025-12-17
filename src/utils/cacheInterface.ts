/**
 * Abstract Cache Interface
 * Supports multiple cache backends (Memory, Redis)
 */

export interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  staleAt: number; // When data becomes stale but still usable
}

export interface CacheAdapter<T = unknown> {
  get(key: string): Promise<CacheEntry<T> | null> | CacheEntry<T> | null;
  /**
   * Get cache entry, including stale data
   * Returns { entry, isStale } where isStale indicates if background refresh needed
   */
  getWithStale(
    key: string
  ): Promise<{ entry: CacheEntry<T> | null; isStale: boolean }> | { entry: CacheEntry<T> | null; isStale: boolean };
  set(key: string, value: T, ttlMs?: number, staleTtlMs?: number): Promise<void> | void;
  delete(key: string): Promise<void> | void;
  clear(): Promise<void> | void;
  size(): Promise<number> | number;
}

/**
 * Cache Backend Type
 */
export type CacheBackend = 'memory' | 'redis';
