import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateReport } from '../../services/reportService';
import { ApiError } from '../../middleware/errorHandler';
import type { NormalizedIpInsight } from '../../types/ip';
import type { ReportRequestBody } from '../../types/report';

const mockInsight: NormalizedIpInsight = {
  ip: '198.51.100.10',
  city: 'New York',
  region: 'NY',
  country: 'US',
  timezone: 'America/New_York',
  org: 'Example ISP',
  asn: 'AS12345',
  networkType: 'isp',
  riskScore: 12,
  riskReasons: [],
  source: 'ipinfo',
  fetchedAt: Date.now(),
};

vi.mock('../../services/ipService', () => ({
  lookupIpInsight: vi.fn(async () => mockInsight),
}));

describe('generateReport', () => {
  const baseFingerprint: ReportRequestBody['fingerprint'] = {
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    languages: ['en-US', 'en'],
    timezone: 'America/New_York',
    screen: {
      width: 1920,
      height: 1080,
      colorDepth: 24,
      pixelRatio: 2,
    },
    platform: 'Win32',
    hardwareConcurrency: 8,
    deviceMemory: 8,
    cookiesEnabled: true,
    webrtcDisabled: false,
    domStorageEnabled: true,
    permissions: [{ name: 'notifications', state: 'prompt' }],
    canvas: {
      hash: 'canvas-hash-123',
      width: 200,
      height: 100,
    },
    webgl: {
      hash: 'webgl-hash-123',
      vendor: 'Google Inc.',
      renderer: 'ANGLE (NVIDIA GeForce RTX 2060)',
    },
    audio: {
      hash: 'audio-hash-123',
    },
    enhancedFonts: {
      hash: 'fonts-hash-123',
      detected: ['Arial', 'Roboto', 'Tahoma'],
      totalTested: 200,
    },
    geolocation: {
      latitude: 40.7128,
      longitude: -74.006,
      accuracy: 25,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a comprehensive report for valid payloads', async () => {
    const payload: ReportRequestBody = { fingerprint: baseFingerprint };

    const report = await generateReport(payload, '203.0.113.5');

    expect(report).toBeDefined();
    expect(report.verdict).toMatch(/trustworthy|suspicious|unreliable/);
    expect(report.panels.browser.score).toBeGreaterThanOrEqual(0);
    expect(report.panels.ipAddress.signals.length).toBeGreaterThan(0);
    expect(report.ip).toBe(mockInsight.ip);
  });

  it('throws ApiError when fingerprint payload is invalid', async () => {
    const invalidPayload: ReportRequestBody = {
      fingerprint: {
        userAgent: 'bot',
      } as ReportRequestBody['fingerprint'],
    };

    await expect(generateReport(invalidPayload, '203.0.113.5')).rejects.toBeInstanceOf(ApiError);
  });
});
