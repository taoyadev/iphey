import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MemoryCache } from '../../utils/cache';
import { createIpbotLookupService, ipbotTtlMs, isHighRisk, normalizeIpbot } from '../ipbotService';
import type { IpbotResult } from '../../types/ipbot';

const makeResult = (overrides: Partial<IpbotResult['data']> = {}): IpbotResult => ({
  data: {
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
    ...overrides,
  },
  rateLimit: { limit: 600, remaining: 599, reset: 1781317620, tier: 'pro' },
  fetchedAt: 1_700_000_000_000,
});

const makeService = (fetchIpbot = vi.fn(async () => makeResult())) =>
  createIpbotLookupService({
    cache: new MemoryCache<IpbotResult>(1000, 10, 1000),
    client: { origin: 'https://api.ipbot.com', apiKey: 'test-key', timeoutMs: 4000, maxRetries: 1 },
    cleanTtlMs: 86_400_000,
    highRiskTtlMs: 3_600_000,
    fetchIpbot,
  });

describe('isHighRisk', () => {
  it('treats a clean result as low risk', () => {
    expect(isHighRisk(makeResult().data)).toBe(false);
  });

  it('flags a high risk_score', () => {
    expect(isHighRisk(makeResult({ score: { risk_score: 90 } }).data)).toBe(true);
  });

  it('flags a bad band / blocking verdict', () => {
    expect(isHighRisk(makeResult({ score: { band: 'bad', verdict: 'block' } }).data)).toBe(true);
  });

  it('flags proxy / vpn / tor classification', () => {
    expect(isHighRisk(makeResult({ classification: { is_proxy: true } }).data)).toBe(true);
    expect(isHighRisk(makeResult({ classification: { threat_level: 'High' } }).data)).toBe(true);
  });

  it('uses shorter TTL for high-risk results', () => {
    expect(ipbotTtlMs(makeResult().data, 86_400_000, 3_600_000)).toBe(86_400_000);
    expect(ipbotTtlMs(makeResult({ classification: { is_tor: true } }).data, 86_400_000, 3_600_000)).toBe(3_600_000);
  });
});

describe('normalizeIpbot', () => {
  it('maps IPbot geo, network, score, and classification fields to normalized insight', () => {
    const insight = normalizeIpbot(makeResult());

    expect(insight).toMatchObject({
      ip: '8.8.8.8',
      city: 'Mountain View',
      region: 'California',
      country: 'US',
      asn: 'AS15169',
      org: 'Google LLC',
      source: 'ipbot',
      riskScore: 30,
    });
  });
});

describe('lookupIP', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches once and serves subsequent calls from cache', async () => {
    const fetchMock = vi.fn(async () => makeResult());
    const service = makeService(fetchMock);

    const first = await service.lookupIP('1.1.1.1');
    const second = await service.lookupIP('1.1.1.1');

    expect(first.data.ip).toBe('8.8.8.8');
    expect(second.data.ip).toBe('8.8.8.8');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('de-duplicates concurrent lookups for the same IP', async () => {
    const fetchMock = vi.fn(
      async () => new Promise<IpbotResult>(resolve => setTimeout(() => resolve(makeResult()), 10))
    );
    const service = makeService(fetchMock);

    const [a, b] = await Promise.all([service.lookupIP('2.2.2.2'), service.lookupIP('2.2.2.2')]);

    expect(a.data.ip).toBe('8.8.8.8');
    expect(b.data.ip).toBe('8.8.8.8');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
