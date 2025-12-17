/**
 * ASN Service Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ASNService, extractASN } from '../../services/asnService';

describe('ASN Service', () => {
  describe('extractASN', () => {
    it('should extract ASN from AS prefix string', () => {
      expect(extractASN('AS15169')).toBe(15169);
      expect(extractASN('as15169')).toBe(15169);
      expect(extractASN('AS 15169')).toBe(15169);
    });

    it('should extract ASN from ASN prefix string', () => {
      expect(extractASN('ASN15169')).toBe(15169);
      expect(extractASN('asn15169')).toBe(15169);
    });

    it('should extract ASN from plain number string', () => {
      expect(extractASN('15169')).toBe(15169);
      expect(extractASN('13335')).toBe(13335);
    });

    it('should handle numeric input', () => {
      expect(extractASN(15169)).toBe(15169);
      expect(extractASN(13335)).toBe(13335);
    });

    it('should return null for invalid input', () => {
      expect(extractASN('')).toBe(null);
      expect(extractASN('invalid')).toBe(null);
      expect(extractASN(undefined)).toBe(null);
      expect(extractASN(0)).toBe(null);
      expect(extractASN(-1)).toBe(null);
    });

    it('should handle edge cases', () => {
      expect(extractASN('  AS15169  ')).toBe(15169); // regex handles whitespace
      expect(extractASN('AS')).toBe(null);
      expect(extractASN('ASN')).toBe(null);
    });
  });

  describe('ASNService', () => {
    let asnService: ASNService;

    beforeEach(() => {
      asnService = new ASNService();
    });

    it('should create service instance', () => {
      expect(asnService).toBeDefined();
      expect(asnService).toBeInstanceOf(ASNService);
    });

    it('should have analyzeASN method', () => {
      expect(asnService.analyzeASN).toBeDefined();
      expect(typeof asnService.analyzeASN).toBe('function');
    });

    it('should have getStatus method', () => {
      expect(asnService.getStatus).toBeDefined();
      expect(typeof asnService.getStatus).toBe('function');
    });

    it('should have isAvailable method', () => {
      expect(asnService.isAvailable).toBeDefined();
      expect(typeof asnService.isAvailable).toBe('function');
    });

    it('should reject invalid ASN numbers', async () => {
      await expect(asnService.analyzeASN(0)).rejects.toThrow('Invalid ASN');
      await expect(asnService.analyzeASN(-1)).rejects.toThrow('Invalid ASN');
    });

    it('should return service status', async () => {
      const status = await asnService.getStatus();

      expect(status).toBeDefined();
      expect(status).toHaveProperty('configured');
      expect(status).toHaveProperty('available');
      expect(status).toHaveProperty('provider');
      expect(status.provider).toBe('Cloudflare Radar');
      expect(typeof status.configured).toBe('boolean');
      expect(typeof status.available).toBe('boolean');
    });
  });
});
