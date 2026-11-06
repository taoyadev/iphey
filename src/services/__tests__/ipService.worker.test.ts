import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createWorkerIpService } from '../ipService.worker';
import type { Env } from '../../worker/types';

const baseEnv = (overrides: Partial<Env> = {}): Env =>
  ({
    CACHE_BACKEND: 'memory',
    CACHE_TTL_MS: '1000',
    CACHE_STALE_TTL_MS: '1000',
    CLIENT_TIMEOUT_MS: '1000',
    IP_CACHE: undefined,
    ...overrides,
  }) as unknown as Env;

const ipbotBody = {
  ip: '8.8.8.8',
  location: {
    city: 'Mountain View',
    region: 'California',
    country_code: 'US',
    latitude: 37.386,
    longitude: -122.084,
    timezone: 'America/Los_Angeles',
  },
  network: { asn: 'AS15169', org: 'Google LLC', category: 'business' },
  score: { risk_score: 30, band: 'good', verdict: 'allow' },
  classification: { threat_level: 'Low', is_proxy: false },
};

const ipinfoBody = {
  ip: '1.1.1.1',
  city: 'Los Angeles',
  region: 'California',
  country: 'US',
  loc: '34.0522,-118.2437',
  org: 'AS13335 Cloudflare, Inc.',
};

const jsonResponse = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
    ...init,
  });

describe('createWorkerIpService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('uses IPbot as the primary provider when configured', async () => {
    const fetchMock = vi.fn(async () => jsonResponse(ipbotBody));
    vi.stubGlobal('fetch', fetchMock);

    const service = createWorkerIpService(baseEnv({ IPBOT_API_KEY: 'test-key' }));
    const result = await service.lookupIpInsight('8.8.8.8');

    expect(result).toMatchObject({
      ip: '8.8.8.8',
      source: 'ipbot',
      city: 'Mountain View',
      asn: 'AS15169',
      org: 'Google LLC',
      riskScore: 30,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.ipbot.com/v1/ip/8.8.8.8');
    expect((init.headers as Record<string, string>)['X-API-Key']).toBe('test-key');
  });

  it('caches normalized IPbot lookups', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ ...ipbotBody, ip: '8.8.4.4' }));
    vi.stubGlobal('fetch', fetchMock);

    const service = createWorkerIpService(baseEnv({ IPBOT_API_KEY: 'test-key' }));
    await service.lookupIpInsight('8.8.4.4');
    await service.lookupIpInsight('8.8.4.4');

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to ipinfo when IPbot is not configured', async () => {
    const fetchMock = vi.fn(async () => jsonResponse(ipinfoBody));
    vi.stubGlobal('fetch', fetchMock);

    const service = createWorkerIpService(baseEnv({ IPINFO_TOKEN: 'ipinfo-token' }));
    const result = await service.lookupIpInsight('1.1.1.1');

    expect(result).toMatchObject({
      ip: '1.1.1.1',
      source: 'ipinfo',
      city: 'Los Angeles',
      asn: 'AS13335',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calls = fetchMock.mock.calls as unknown as Array<[string, RequestInit?]>;
    expect(String(calls[0][0])).toContain('https://ipinfo.io/1.1.1.1/json');
  });
});

it('does not invent a location or risk when all sources are absent', async () => {
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  await expect(createWorkerIpService(baseEnv()).lookupIpInsight('9.9.9.9')).rejects.toMatchObject({ status: 503 });
  expect(fetchMock).not.toHaveBeenCalled();
});
it('rejects special-use queries without provider calls', async () => {
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  await expect(createWorkerIpService(baseEnv()).lookupIpInsight('192.168.1.1')).rejects.toMatchObject({ status: 422 });
  expect(fetchMock).not.toHaveBeenCalled();
});

it('bounds failed provider attempts and shares cold concurrent and warm lookups', async () => {
  const failing = vi.fn(async () => new Response('{}', { status: 503 }));
  vi.stubGlobal('fetch', failing);
  const failingService = createWorkerIpService(
    baseEnv({
      IPBOT_API_KEY: 'test-key',
      IPINFO_TOKEN: 'test-token',
      CLOUDFLARE_ACCOUNT_ID: 'test-account',
      CLOUDFLARE_RADAR_TOKEN: 'test-token',
    })
  );
  await expect(failingService.lookupIpInsight('9.9.9.9')).rejects.toMatchObject({ status: 503 });
  expect(failing).toHaveBeenCalledTimes(3);
  const working = vi.fn(async () => jsonResponse(ipinfoBody));
  vi.stubGlobal('fetch', working);
  const service = createWorkerIpService(baseEnv({ IPINFO_TOKEN: 'test-token' }));
  const results = await Promise.all(Array.from({ length: 100 }, () => service.lookupIpInsight('1.1.1.1')));
  expect(results.every(r => r.ip === '1.1.1.1')).toBe(true);
  for (let i = 0; i < 100; i++) await service.lookupIpInsight('1.1.1.1');
  expect(working).toHaveBeenCalledTimes(1);
});

it('retains original time on failed stale refresh and refuses expired data', async () => {
  vi.useFakeTimers();
  try {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(ipinfoBody))
      .mockImplementation(async () => new Response('{}', { status: 503 }));
    vi.stubGlobal('fetch', fetchMock);
    const service = createWorkerIpService(
      baseEnv({ IPINFO_TOKEN: 'test-token', CACHE_TTL_MS: '1000', CACHE_STALE_TTL_MS: '5000' })
    );
    const original = await service.lookupIpInsight('1.1.1.1');
    await vi.advanceTimersByTimeAsync(1500);
    const stale = await service.lookupIpInsight('1.1.1.1');
    expect(stale).toMatchObject({ cacheStatus: 'stale', refreshFailed: true, fetchedAt: original.fetchedAt });
    await vi.advanceTimersByTimeAsync(4000);
    await expect(service.lookupIpInsight('1.1.1.1')).rejects.toMatchObject({ status: 503 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  } finally {
    vi.useRealTimers();
  }
});

it('propagates cancellation to the shared provider only after all request subscribers leave', async () => {
  let upstream!: AbortSignal;
  const fetchMock = vi.fn((_url: string, init?: RequestInit) => {
    upstream = init!.signal!;
    return new Promise<Response>((_resolve, reject) =>
      upstream.addEventListener('abort', () => reject(upstream.reason), { once: true })
    );
  });
  vi.stubGlobal('fetch', fetchMock);
  const service = createWorkerIpService(baseEnv({ IPBOT_API_KEY: 'test-key' }));
  const a = new AbortController(),
    b = new AbortController();
  const first = service.lookupIpInsight('8.8.8.8', a.signal);
  const failedFirst = expect(first).rejects.toMatchObject({ name: 'AbortError' });
  const second = service.lookupIpInsight('8.8.8.8', b.signal);
  const failedSecond = expect(second).rejects.toMatchObject({ name: 'AbortError' });
  await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  a.abort();
  expect(upstream.aborted).toBe(false);
  b.abort();
  await Promise.all([failedFirst, failedSecond]);
  expect(upstream.aborted).toBe(true);
});

it('uses IPbot classification signals for the short refresh TTL even when the supplied score is zero', async () => {
  vi.useFakeTimers();
  try {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ ...ipbotBody, score: { risk_score: 0 }, classification: { is_proxy: true } })
    );
    vi.stubGlobal('fetch', fetchMock);
    const service = createWorkerIpService(
      baseEnv({ IPBOT_API_KEY: 'test-key', CACHE_TTL_IPBOT_MS: '5000', CACHE_TTL_IPBOT_HIGH_RISK_MS: '1000' })
    );
    await service.lookupIpInsight('8.8.8.8');
    await vi.advanceTimersByTimeAsync(1500);
    await service.lookupIpInsight('8.8.8.8');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  } finally {
    vi.useRealTimers();
  }
});
it('does not reuse cached data for another IP or beyond the source age budget', async () => {
  const now = Date.now();
  for (const data of [
    { ip: '9.9.9.9', fetchedAt: now },
    { ip: '1.1.1.1', fetchedAt: 1 },
  ]) {
    const kv = {
      get: vi.fn(async () => ({ data: { ...data, source: 'ipinfo' }, staleAt: now + 50000, expiresAt: now + 60000 })),
      put: vi.fn(async () => undefined),
    };
    const fetchMock = vi.fn(async () => jsonResponse(ipinfoBody));
    vi.stubGlobal('fetch', fetchMock);
    const service = createWorkerIpService(
      baseEnv({ CACHE_BACKEND: 'kv', IP_CACHE: kv as unknown as Env['IP_CACHE'], IPINFO_TOKEN: 'test-key' })
    );
    expect((await service.lookupIpInsight('1.1.1.1')).ip).toBe('1.1.1.1');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  }
});
