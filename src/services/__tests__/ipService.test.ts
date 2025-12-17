import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../clients/ipinfoClient', () => ({
  fetchIpInfo: vi.fn(),
}));

vi.mock('../../clients/cloudflareRadarClient', () => ({
  fetchRadarIp: vi.fn(),
}));

import { lookupIpInsight } from '../ipService';
import { fetchIpInfo } from '../../clients/ipinfoClient';
import { fetchRadarIp } from '../../clients/cloudflareRadarClient';
import { config } from '../../config';
import type { IpInfoDetails, RadarIpResponse } from '../../types/ip';

const ipinfoMock = vi.mocked(fetchIpInfo);
const radarMock = vi.mocked(fetchRadarIp);

const sampleIpinfo: IpInfoDetails = {
  ip: '8.8.8.8',
  city: 'Mountain View',
  region: 'California',
  country: 'US',
  loc: '37.4056,-122.0775',
  org: 'AS15169 Google LLC',
};

const sampleRadar: RadarIpResponse = {
  ip: '9.9.9.9',
  location: { city: 'New York', country: 'US', latitude: 40.7, longitude: -73.9 },
  traits: { network_type: 'residential' },
  autonomous_system: { asn: 999, name: 'Test' },
};

describe('lookupIpInsight', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    config.IPINFO_TOKEN = 'test-token';
    config.CLOUDFLARE_ACCOUNT_ID = 'acc';
    config.CLOUDFLARE_RADAR_TOKEN = 'radar-token';
  });

  it('prefers ipinfo data and caches responses', async () => {
    ipinfoMock.mockResolvedValue(sampleIpinfo);

    const first = await lookupIpInsight('8.8.8.8');
    const second = await lookupIpInsight('8.8.8.8');

    expect(first.city).toBe('Mountain View');
    expect(second.city).toBe('Mountain View');
    expect(ipinfoMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to radar when ipinfo is unavailable', async () => {
    config.IPINFO_TOKEN = undefined;
    radarMock.mockResolvedValue(sampleRadar);

    const result = await lookupIpInsight('9.9.9.9');

    expect(result.ip).toBe('9.9.9.9');
    expect(result.source).toBe('radar');
    expect(radarMock).toHaveBeenCalledTimes(1);
  });
});
