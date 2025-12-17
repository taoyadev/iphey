import express from 'express';
import request from 'supertest';
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import type { EnhancedIpDetectionResult } from '../../services/enhancedIpService';

const mockDetectIp = vi.fn();
const mockGetStatus = vi.fn();

vi.mock('../../services/enhancedIpService', () => {
  class MockEnhancedIpService {
    detectIP = mockDetectIp;
    getServiceStatus = mockGetStatus;
  }

  return {
    EnhancedIpService: MockEnhancedIpService,
  };
});

vi.mock('../../services/ipService', () => ({
  lookupIpInsight: vi.fn(async () => ({
    ip: '8.8.8.8',
    source: 'ipinfo',
    fetchedAt: Date.now(),
  })),
}));

let app: express.Express;

beforeAll(async () => {
  const { ipRouter } = await import('../ip.js');
  app = express();
  app.use(ipRouter);
});

describe('ipRouter enhanced endpoints', () => {
  const enhancedResponse: EnhancedIpDetectionResult = {
    ip: '8.8.8.8',
    geolocation: {
      ip: '8.8.8.8',
      source: 'ipinfo',
      fetchedAt: Date.now(),
    },
    risk_assessment: {
      overall_score: 10,
      overall_level: 'low',
      factors: ['clean'],
      recommendation: 'ok',
    },
    sources_used: ['ipinfo'],
    analysis_timestamp: new Date().toISOString(),
  };

  beforeEach(() => {
    mockDetectIp.mockClear();
    mockGetStatus.mockClear();
    mockDetectIp.mockResolvedValue(enhancedResponse);
    mockGetStatus.mockResolvedValue({
      geolocation: true,
      threat_intelligence: true,
      asn_analysis: true,
    });
  });

  it('handles explicit enhanced IP lookups', async () => {
    const response = await request(app).get('/v1/ip/8.8.8.8/enhanced?threats=false');

    expect(response.status).toBe(200);
    expect(response.body.ip).toBe('8.8.8.8');
    expect(mockDetectIp).toHaveBeenCalledWith('8.8.8.8', {
      includeThreat: false,
      includeASN: true,
    });
  });

  it('handles client enhanced lookups without explicit IP parameter', async () => {
    const response = await request(app).get('/v1/ip/enhanced');

    expect(response.status).toBe(200);
    expect(mockDetectIp).toHaveBeenCalled();
  });
});
