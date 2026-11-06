import { it, expect, vi } from 'vitest';
import { CloudflareKVCache } from '../cloudflareKVCache';
import type { KVNamespace } from '@cloudflare/workers-types';
it('keeps application expiry distinct from the KV minimum retention and does not delete during expired reads', async () => {
  vi.useFakeTimers();
  try {
    let entry: unknown = null;
    const kv = {
      get: vi.fn(async () => entry),
      put: vi.fn(async (_key: string, value: string, options: { expirationTtl: number }) => {
        expect(options.expirationTtl).toBeGreaterThanOrEqual(60);
        entry = JSON.parse(value);
      }),
      delete: vi.fn(),
    };
    const cache = new CloudflareKVCache(kv as unknown as KVNamespace, 1000, 2000);
    await cache.set('key', { value: 1 });
    expect((await cache.getWithStale('key')).isStale).toBe(false);
    await vi.advanceTimersByTimeAsync(1000);
    expect((await cache.getWithStale('key')).isStale).toBe(true);
    await vi.advanceTimersByTimeAsync(1000);
    expect((await cache.getWithStale('key')).entry).toBeNull();
    expect(kv.delete).not.toHaveBeenCalled();
  } finally {
    vi.useRealTimers();
  }
});
it('rejects malformed cache envelopes instead of treating absent times as fresh', async () => {
  for (const entry of [
    { data: {}, staleAt: 'later', expiresAt: Date.now() + 1000 },
    { data: {}, staleAt: 100, expiresAt: 50 },
    { data: {} },
    {},
  ]) {
    const cache = new CloudflareKVCache({ get: async () => entry } as unknown as KVNamespace);
    expect(await cache.get('key')).toBeNull();
    expect((await cache.getWithStale('key')).entry).toBeNull();
  }
});
