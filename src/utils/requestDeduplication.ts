/**
 * Request Deduplication Utility
 * Prevents duplicate concurrent requests for the same resource
 */

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

class RequestDeduplicator {
  private pending = new Map<string, PendingRequest<unknown>>();
  private readonly ttl: number;

  constructor(ttlMs: number = 5000) {
    this.ttl = ttlMs;
  }

  /**
   * Deduplicate requests by key
   * If a request for the same key is already in flight, return the existing promise
   */
  async deduplicate<T>(key: string, fn: () => Promise<T>): Promise<T> {
    this.cleanup();
    const existing = this.pending.get(key) as PendingRequest<T> | undefined;

    // Return existing request if still valid
    if (existing && Date.now() - existing.timestamp < this.ttl) {
      return existing.promise;
    }

    // Create new request
    const promise = fn()
      .then(result => {
        this.pending.delete(key);
        return result;
      })
      .catch(error => {
        this.pending.delete(key);
        throw error;
      });

    this.pending.set(key, {
      promise,
      timestamp: Date.now(),
    });

    return promise;
  }

  /**
   * Clean up expired entries
   */
  private cleanup() {
    const now = Date.now();
    for (const [key, request] of this.pending.entries()) {
      if (now - request.timestamp >= this.ttl) {
        this.pending.delete(key);
      }
    }
  }

  /**
   * Get current pending request count
   */
  get size(): number {
    return this.pending.size;
  }

  /**
   * Clear all pending requests
   */
  clear() {
    this.pending.clear();
  }
}

// Global deduplicator instance
export const requestDeduplicator = new RequestDeduplicator();
