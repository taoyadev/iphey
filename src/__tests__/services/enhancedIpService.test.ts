/**
 * Enhanced IP Service Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EnhancedIpService } from '../../services/enhancedIpService';

// Mock the dependencies
vi.mock('../../services/ipService', () => ({
  lookupIpInsight: vi.fn(async () => ({
    ip: '8.8.8.8',
    source: 'ipinfo',
    continent: 'NA',
    country: 'US',
    countryName: 'United States',
    region: 'California',
    city: 'Mountain View',
    latitude: 37.386,
    longitude: -122.084,
    timezone: 'America/Los_Angeles',
    asn: 'AS15169',
    org: 'GOOGLE',
    isp: 'Google LLC',
    privacy: {
      vpn: false,
      proxy: false,
      tor: false,
      hosting: false,
      relay: false,
    },
  })),
}));

vi.mock('../../services/threatIntelligence', () => {
  class MockThreatIntelligenceService {
    async analyzeIP() {
      return {
        providers: {
          abuseipdb: {
            is_malicious: false,
            abuse_confidence_score: 0,
            total_reports: 0,
            last_reported: null,
          },
          spamhaus: {
            is_listed: false,
            listings: [],
          },
        },
        combined: {
          is_malicious: false,
          threat_score: 0,
          threat_level: 'low' as const,
          threat_types: [],
          sources: ['AbuseIPDB', 'Spamhaus'],
          confidence: 0.95,
        },
        timestamp: new Date().toISOString(),
      };
    }

    async getProviderStatus() {
      return {
        abuseipdb: { configured: false, available: false },
        spamhaus: { configured: true, available: true },
        available_sources: 1,
        total_sources: 2,
      };
    }
  }

  return {
    ThreatIntelligenceService: MockThreatIntelligenceService,
  };
});

vi.mock('../../services/asnService', () => {
  class MockASNService {
    async analyzeASN() {
      return {
        asn: 15169,
        info: {
          asn: 15169,
          name: 'GOOGLE',
          description: 'Google LLC',
          country: 'US',
        },
        timestamp: new Date().toISOString(),
      };
    }

    async getStatus() {
      return {
        configured: true,
        available: true,
        provider: 'Cloudflare Radar',
      };
    }
  }

  return {
    extractASN: (input: string | number | undefined): number | null => {
      if (input === 'AS15169') return 15169;
      if (typeof input === 'string' && input.match(/AS(\d+)/)) {
        const match = input.match(/AS(\d+)/);
        return match ? parseInt(match[1], 10) : null;
      }
      return null;
    },
    ASNService: MockASNService,
  };
});

describe('Enhanced IP Service', () => {
  let enhancedService: EnhancedIpService;

  beforeEach(() => {
    enhancedService = new EnhancedIpService();
  });

  describe('Service Initialization', () => {
    it('should create service instance', () => {
      expect(enhancedService).toBeDefined();
      expect(enhancedService).toBeInstanceOf(EnhancedIpService);
    });

    it('should have detectIP method', () => {
      expect(enhancedService.detectIP).toBeDefined();
      expect(typeof enhancedService.detectIP).toBe('function');
    });

    it('should have getServiceStatus method', () => {
      expect(enhancedService.getServiceStatus).toBeDefined();
      expect(typeof enhancedService.getServiceStatus).toBe('function');
    });
  });

  describe('detectIP', () => {
    it('should return comprehensive IP analysis with all fields', async () => {
      const result = await enhancedService.detectIP('8.8.8.8');

      expect(result).toBeDefined();
      expect(result).toHaveProperty('ip');
      expect(result).toHaveProperty('geolocation');
      expect(result).toHaveProperty('risk_assessment');
      expect(result).toHaveProperty('sources_used');
      expect(result).toHaveProperty('analysis_timestamp');

      // IP should match
      expect(result.ip).toBe('8.8.8.8');

      // Geolocation should be present
      expect(result.geolocation).toBeDefined();
      expect(result.geolocation.ip).toBe('8.8.8.8');

      // Sources used should be array
      expect(Array.isArray(result.sources_used)).toBe(true);
      expect(result.sources_used.length).toBeGreaterThan(0);

      // Timestamp should be ISO string
      expect(result.analysis_timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should include threat intelligence when requested', async () => {
      const result = await enhancedService.detectIP('8.8.8.8', {
        includeThreat: true,
        includeASN: false,
      });

      expect(result.threats).toBeDefined();
      expect(result.threats).toHaveProperty('providers');
      expect(result.threats).toHaveProperty('combined');
    });

    it('should exclude threat intelligence when disabled', async () => {
      const result = await enhancedService.detectIP('8.8.8.8', {
        includeThreat: false,
        includeASN: false,
      });

      expect(result.threats).toBeUndefined();
    });

    it('should exclude ASN analysis when disabled', async () => {
      const result = await enhancedService.detectIP('8.8.8.8', {
        includeThreat: false,
        includeASN: false,
      });

      expect(result.asn_analysis).toBeUndefined();
    });

    it('should handle all analysis options enabled', async () => {
      const result = await enhancedService.detectIP('8.8.8.8', {
        includeThreat: true,
        includeASN: true,
      });

      expect(result.geolocation).toBeDefined();
      expect(result.threats).toBeDefined();
      expect(result.asn_analysis).toBeDefined();
    });
  });

  describe('Risk Assessment', () => {
    it('should calculate risk assessment with all required fields', async () => {
      const result = await enhancedService.detectIP('8.8.8.8');

      expect(result.risk_assessment).toBeDefined();
      expect(result.risk_assessment).toHaveProperty('overall_score');
      expect(result.risk_assessment).toHaveProperty('overall_level');
      expect(result.risk_assessment).toHaveProperty('factors');
      expect(result.risk_assessment).toHaveProperty('recommendation');

      // Score should be in valid range
      expect(result.risk_assessment.overall_score).toBeGreaterThanOrEqual(0);
      expect(result.risk_assessment.overall_score).toBeLessThanOrEqual(100);

      // Level should be valid
      expect(['low', 'medium', 'high', 'critical']).toContain(result.risk_assessment.overall_level);

      // Factors should be array
      expect(Array.isArray(result.risk_assessment.factors)).toBe(true);

      // Recommendation should be string
      expect(typeof result.risk_assessment.recommendation).toBe('string');
      expect(result.risk_assessment.recommendation.length).toBeGreaterThan(0);
    });

    it('should assign low risk to clean IPs', async () => {
      const result = await enhancedService.detectIP('8.8.8.8');

      // Google DNS should be low risk (mocked data has no risk factors)
      expect(result.risk_assessment.overall_level).toBe('low');
      expect(result.risk_assessment.overall_score).toBeLessThan(30);
    });

    it('should provide meaningful risk factors', async () => {
      const result = await enhancedService.detectIP('8.8.8.8');

      expect(result.risk_assessment.factors).toBeDefined();
      expect(result.risk_assessment.factors.length).toBeGreaterThan(0);
      expect(result.risk_assessment.factors.every(f => typeof f === 'string')).toBe(true);
    });

    it('should map risk levels correctly', async () => {
      const result = await enhancedService.detectIP('8.8.8.8');
      const { overall_score, overall_level } = result.risk_assessment;

      // Check level matches score range
      if (overall_score >= 70) {
        expect(overall_level).toBe('critical');
      } else if (overall_score >= 50) {
        expect(overall_level).toBe('high');
      } else if (overall_score >= 30) {
        expect(overall_level).toBe('medium');
      } else {
        expect(overall_level).toBe('low');
      }
    });
  });

  describe('getServiceStatus', () => {
    it('should return status for all services', async () => {
      const status = await enhancedService.getServiceStatus();

      expect(status).toBeDefined();
      expect(status).toHaveProperty('geolocation');
      expect(status).toHaveProperty('threat_intelligence');
      expect(status).toHaveProperty('asn_analysis');

      // All should be boolean
      expect(typeof status.geolocation).toBe('boolean');
      expect(typeof status.threat_intelligence).toBe('boolean');
      expect(typeof status.asn_analysis).toBe('boolean');

      // Geolocation should always be available
      expect(status.geolocation).toBe(true);
    });
  });

  describe('Multiple IP Analysis', () => {
    it('should handle multiple IP addresses', async () => {
      const ips = ['8.8.8.8', '1.1.1.1'];

      const results = await Promise.all(
        ips.map(ip =>
          enhancedService.detectIP(ip, {
            includeThreat: false,
            includeASN: false,
          })
        )
      );

      expect(results.length).toBe(2);
      expect(results[0].ip).toBe('8.8.8.8');
      expect(results[1].ip).toBe('1.1.1.1');
    });

    it('should provide consistent results for same IP', async () => {
      const result1 = await enhancedService.detectIP('8.8.8.8', {
        includeThreat: false,
        includeASN: false,
      });
      const result2 = await enhancedService.detectIP('8.8.8.8', {
        includeThreat: false,
        includeASN: false,
      });

      expect(result1.ip).toBe(result2.ip);
      expect(result1.geolocation.country).toBe(result2.geolocation.country);
    });
  });
});
