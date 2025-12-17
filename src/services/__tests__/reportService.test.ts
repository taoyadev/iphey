import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { NormalizedIpInsight } from '../../types/ip';

vi.mock('../ipService', () => ({
  lookupIpInsight: vi.fn(),
}));

import { generateReport } from '../reportService';
import { lookupIpInsight } from '../ipService';
import type { FingerprintPayload } from '../../types/report';
const lookupMock = vi.mocked(lookupIpInsight);

const baseFingerprint: FingerprintPayload = {
  userAgent:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
  languages: ['en-US', 'en'],
  timezone: 'America/Los_Angeles',
  screen: { width: 1920, height: 1080, colorDepth: 24 },
  platform: 'MacIntel',
  hardwareConcurrency: 8,
  deviceMemory: 8,
  webglVendor: 'ANGLE (Apple, Apple M1, OpenGL 4.1)',
  canvasFingerprint: 'abc123',
  fonts: ['Arial', 'Helvetica'],
  cookiesEnabled: true,
};

const baseInsight: NormalizedIpInsight = {
  ip: '1.1.1.1',
  country: 'US',
  region: 'California',
  city: 'Los Angeles',
  timezone: 'America/Los_Angeles',
  org: 'Cloudflare',
  source: 'ipinfo',
  fetchedAt: Date.now(),
};

describe('generateReport', () => {
  beforeEach(() => {
    lookupMock.mockResolvedValue(baseInsight);
  });

  it('returns a trustworthy verdict when signals are clean', async () => {
    const result = await generateReport({ fingerprint: baseFingerprint, ip: '1.1.1.1' });

    expect(result.verdict).toBe('trustworthy');
    expect(result.panels.browser.status).toBe('trustworthy');
    expect(result.panels.ipAddress.status).toBe('trustworthy');
    expect(result.ip).toBe('1.1.1.1');
  });

  it('downgrades verdict when timezone mismatches ip metadata', async () => {
    lookupMock.mockResolvedValue({
      ...baseInsight,
      timezone: 'Europe/London',
    });

    const result = await generateReport({
      fingerprint: { ...baseFingerprint, timezone: 'America/Los_Angeles' },
      ip: '1.1.1.1',
    });

    expect(result.panels.location.status).toBe('unreliable');
  });

  it('throws when payload is invalid', async () => {
    const invalidFingerprint: FingerprintPayload = { ...baseFingerprint, userAgent: '' };
    await expect(generateReport({ fingerprint: invalidFingerprint, ip: '1.1.1.1' })).rejects.toThrowError(
      /Invalid request body/
    );
  });
});
