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
    const fetchMock = vi.fn(async () => jsonResponse(ipbotBody));
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
