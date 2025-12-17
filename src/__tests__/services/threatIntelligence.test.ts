/**
 * Threat Intelligence Service Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ThreatIntelligenceService } from '../../services/threatIntelligence';

// Mock the API clients
vi.mock('../../clients/abuseipdbClient', () => {
  class MockAbuseIPDBClient {
    async checkIP() {
      return {
        is_malicious: false,
        abuse_confidence_score: 0,
        total_reports: 0,
        last_reported: null,
        usage_type: null,
        country_code: 'US',
      };
    }

    async isAvailable() {
      return false; // Not configured in test environment
    }

    isConfigured() {
      return false;
    }

    getRateLimit() {
      return {
        requests_per_day: 1000,
        requests_per_hour: 42,
      };
    }
  }

  return {
    AbuseIPDBClient: MockAbuseIPDBClient,
  };
});

vi.mock('../../clients/spamhausClient', () => {
  class MockSpamhausClient {
    async checkIP() {
      return {
        is_listed: false,
        listings: [],
      };
    }

    async isAvailable() {
      return true; // Always available (no API key required)
    }

    isConfigured() {
      return true;
    }

    getRateLimit() {
      return {
        requests_per_day: 10000,
        requests_per_hour: 417,
      };
    }
  }

  return {
    SpamhausClient: MockSpamhausClient,
  };
});

describe('Threat Intelligence Service', () => {
  let threatService: ThreatIntelligenceService;

  beforeEach(() => {
    threatService = new ThreatIntelligenceService();
  });

  describe('Service Initialization', () => {
    it('should create service instance', () => {
      expect(threatService).toBeDefined();
      expect(threatService).toBeInstanceOf(ThreatIntelligenceService);
    });

    it('should have analyzeIP method', () => {
      expect(threatService.analyzeIP).toBeDefined();
      expect(typeof threatService.analyzeIP).toBe('function');
    });

    it('should have getProviderStatus method', () => {
      expect(threatService.getProviderStatus).toBeDefined();
      expect(typeof threatService.getProviderStatus).toBe('function');
    });

    it('should have getRateLimits method', () => {
      expect(threatService.getRateLimits).toBeDefined();
      expect(typeof threatService.getRateLimits).toBe('function');
    });
  });

  describe('analyzeIP', () => {
    it('should return threat analysis result with required fields', async () => {
      const result = await threatService.analyzeIP('8.8.8.8');

      expect(result).toBeDefined();
      expect(result).toHaveProperty('providers');
      expect(result).toHaveProperty('combined');
      expect(result).toHaveProperty('timestamp');

      // Check providers structure
      expect(result.providers).toHaveProperty('abuseipdb');
      expect(result.providers).toHaveProperty('spamhaus');

      // Check combined analysis
      expect(result.combined).toHaveProperty('is_malicious');
      expect(result.combined).toHaveProperty('threat_score');
      expect(result.combined).toHaveProperty('threat_level');
      expect(result.combined).toHaveProperty('threat_types');
      expect(result.combined).toHaveProperty('sources');
      expect(result.combined).toHaveProperty('confidence');

      // Type checks
      expect(typeof result.combined.is_malicious).toBe('boolean');
      expect(typeof result.combined.threat_score).toBe('number');
      expect(['low', 'medium', 'high', 'critical']).toContain(result.combined.threat_level);
      expect(Array.isArray(result.combined.threat_types)).toBe(true);
      expect(Array.isArray(result.combined.sources)).toBe(true);
      expect(typeof result.combined.confidence).toBe('number');
    });

    it('should handle valid IPv4 addresses', async () => {
      const result = await threatService.analyzeIP('1.1.1.1');
      expect(result).toBeDefined();
      expect(result.combined.threat_score).toBeGreaterThanOrEqual(0);
      expect(result.combined.threat_score).toBeLessThanOrEqual(100);
    });

    it('should calculate threat score within valid range', async () => {
      const result = await threatService.analyzeIP('8.8.8.8');
      expect(result.combined.threat_score).toBeGreaterThanOrEqual(0);
      expect(result.combined.threat_score).toBeLessThanOrEqual(100);
    });

    it('should set confidence within valid range', async () => {
      const result = await threatService.analyzeIP('8.8.8.8');
      expect(result.combined.confidence).toBeGreaterThanOrEqual(0);
      expect(result.combined.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('getProviderStatus', () => {
    it('should return provider status with required fields', async () => {
      const status = await threatService.getProviderStatus();

      expect(status).toBeDefined();
      expect(status).toHaveProperty('abuseipdb');
      expect(status).toHaveProperty('spamhaus');
      expect(status).toHaveProperty('available_sources');
      expect(status).toHaveProperty('total_sources');

      // Check provider structure
      expect(status.abuseipdb).toHaveProperty('configured');
      expect(status.abuseipdb).toHaveProperty('available');
      expect(status.spamhaus).toHaveProperty('configured');
      expect(status.spamhaus).toHaveProperty('available');

      // Type checks
      expect(typeof status.abuseipdb.configured).toBe('boolean');
      expect(typeof status.abuseipdb.available).toBe('boolean');
      expect(typeof status.spamhaus.configured).toBe('boolean');
      expect(typeof status.spamhaus.available).toBe('boolean');
      expect(typeof status.available_sources).toBe('number');
      expect(typeof status.total_sources).toBe('number');

      // Logical checks
      expect(status.total_sources).toBe(2); // AbuseIPDB + Spamhaus
      expect(status.available_sources).toBeGreaterThanOrEqual(0);
      expect(status.available_sources).toBeLessThanOrEqual(status.total_sources);
    });

    it('should have Spamhaus always configured (no API key needed)', async () => {
      const status = await threatService.getProviderStatus();
      expect(status.spamhaus.configured).toBe(true);
    });
  });

  describe('getRateLimits', () => {
    it('should return rate limits for all providers', () => {
      const rateLimits = threatService.getRateLimits();

      expect(rateLimits).toBeDefined();
      expect(rateLimits).toHaveProperty('abuseipdb');
      expect(rateLimits).toHaveProperty('spamhaus');

      // Check AbuseIPDB rate limits
      expect(rateLimits.abuseipdb).toHaveProperty('requests_per_day');
      expect(rateLimits.abuseipdb).toHaveProperty('requests_per_hour');
      expect(rateLimits.abuseipdb.requests_per_day).toBe(1000);
      expect(rateLimits.abuseipdb.requests_per_hour).toBe(42);

      // Check Spamhaus rate limits
      expect(rateLimits.spamhaus).toHaveProperty('requests_per_day');
      expect(rateLimits.spamhaus).toHaveProperty('requests_per_hour');
      expect(rateLimits.spamhaus.requests_per_day).toBe(10000);
      expect(rateLimits.spamhaus.requests_per_hour).toBe(417);
    });
  });

  describe('Threat Level Calculation', () => {
    it('should assign correct threat levels based on scores', async () => {
      const result = await threatService.analyzeIP('8.8.8.8'); // Clean IP (mocked)

      // Mocked data should show low risk
      expect(result.combined.threat_level).toBe('low');
      expect(result.combined.is_malicious).toBe(false);
      expect(result.combined.threat_score).toBeLessThan(20);
    });
  });
});
