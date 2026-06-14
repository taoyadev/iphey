import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchIpbotIp } from '../ipbotClient';

const sampleBody = {
  ip: '8.8.8.8',
  score: { risk_score: 30, band: 'good', verdict: 'allow' },
  classification: { threat_level: 'Low', is_proxy: false },
};

const makeResponse = (body: unknown, init: ResponseInit): Response =>
  new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json' },
    ...init,
  });

describe('fetchIpbotIp', () => {
  const options = {
    origin: 'https://api.ipbot.com',
    apiKey: 'test-ipbot-key',
    timeoutMs: 4000,
    maxRetries: 3,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sends the X-API-Key header and parses rate-limit headers', async () => {
    const fetchMock = vi.fn(async () =>
      makeResponse(sampleBody, {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'x-ratelimit-limit': '600',
          'x-ratelimit-remaining': '599',
          'x-ratelimit-reset': '1781317620',
          'x-ratelimit-tier': 'pro',
        },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchIpbotIp('8.8.8.8', options);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, requestInit] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.ipbot.com/v1/ip/8.8.8.8');
    expect((requestInit.headers as Record<string, string>)['X-API-Key']).toBe('test-ipbot-key');

    expect(result.data.ip).toBe('8.8.8.8');
    expect(result.rateLimit).toEqual({ limit: 600, remaining: 599, reset: 1781317620, tier: 'pro' });
    expect(typeof result.fetchedAt).toBe('number');
  });

  it('backs off on 429 (honouring Retry-After) then succeeds', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(makeResponse({}, { status: 429, headers: { 'retry-after': '0' } }))
      .mockResolvedValueOnce(makeResponse(sampleBody, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchIpbotIp('8.8.8.8', options);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.data.ip).toBe('8.8.8.8');
  });

  it('throws after exhausting retries on persistent 429', async () => {
    const fetchMock = vi.fn(async () => makeResponse({}, { status: 429, headers: { 'retry-after': '0' } }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchIpbotIp('8.8.8.8', { ...options, maxRetries: 1 })).rejects.toThrow(/429/);
    expect(fetchMock).toHaveBeenCalledTimes(2); // initial + 1 retry
  });

  it('throws when IPBOT_API_KEY is not configured', async () => {
    await expect(fetchIpbotIp('8.8.8.8', { ...options, apiKey: undefined })).rejects.toThrow(/IPBOT_API_KEY/);
  });
});
