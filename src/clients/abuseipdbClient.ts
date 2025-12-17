/**
 * AbuseIPDB API Client
 * Provides IP reputation and threat intelligence data from AbuseIPDB
 *
 * API Documentation: https://www.abuseipdb.com/api.html
 * Rate Limit: 1000 requests/day (free tier)
 */

import type { ThreatIntelResult, AbuseIPDBResponse } from '../types/threat';
import { logger } from '../utils/logger';

export class AbuseIPDBClient {
  private readonly baseUrl = 'https://api.abuseipdb.com/api/v2';
  private readonly apiKey: string | undefined;
  private readonly rateLimit = { requests_per_day: 1000, requests_per_hour: 42 };
  private readonly timeout = 5000; // 5 seconds

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  /**
   * Check IP reputation against AbuseIPDB database
   *
   * @param ip - IP address to check
   * @param maxAgeInDays - Maximum age of reports to consider (default: 90 days)
   * @returns Threat intelligence result
   */
  async checkIP(ip: string, maxAgeInDays: number = 90): Promise<ThreatIntelResult> {
    if (!this.apiKey) {
      logger.warn('AbuseIPDB API key not configured');
      return {
        source: 'AbuseIPDB',
        is_listed: false,
        threat_types: [],
        confidence: 0,
        error: 'API key not configured',
      };
    }

    try {
      const url = `${this.baseUrl}/check?ipAddress=${encodeURIComponent(ip)}&maxAgeInDays=${maxAgeInDays}&verbose`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Key: this.apiKey,
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AbuseIPDB API error: ${response.status} - ${errorText}`);
      }

      const data: AbuseIPDBResponse = await response.json();

      if (!data.data) {
        throw new Error('Invalid API response: missing data field');
      }

      const abuseScore = data.data.abuseConfidenceScore || 0;
      const reports = data.data.totalReports || 0;
      const isListed = abuseScore > 25; // Consider listed if abuse score > 25%

      const result: ThreatIntelResult = {
        source: 'AbuseIPDB',
        is_listed: isListed,
        threat_types: this.mapThreatTypes(data.data.usageType || '', isListed),
        confidence: abuseScore / 100,
        last_checked: new Date().toISOString(),
        reports,
        abuse_confidence_score: abuseScore,
      };

      logger.debug({ ip, abuseScore, reports, isListed }, 'AbuseIPDB check completed');
      return result;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        logger.error({ ip }, 'AbuseIPDB check timeout');
        return {
          source: 'AbuseIPDB',
          is_listed: false,
          threat_types: [],
          confidence: 0,
          error: 'Request timeout',
        };
      }

      logger.error({ ip, error }, 'AbuseIPDB check failed');
      return {
        source: 'AbuseIPDB',
        is_listed: false,
        threat_types: [],
        confidence: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Map usage type to threat types
   *
   * @param usageType - Usage type from AbuseIPDB
   * @param isListed - Whether the IP is listed
   * @returns Array of threat types
   */
  private mapThreatTypes(usageType: string, isListed: boolean): string[] {
    const types: string[] = [];

    if (!isListed) {
      return types;
    }

    const lowerType = usageType.toLowerCase();

    if (lowerType.includes('hosting') || lowerType.includes('datacenter')) {
      types.push('datacenter');
    }
    if (lowerType.includes('proxy')) {
      types.push('proxy');
    }
    if (lowerType.includes('vpn')) {
      types.push('vpn');
    }
    if (lowerType.includes('tor')) {
      types.push('tor');
    }

    // If no specific type found but IP is listed, mark as general malicious
    if (types.length === 0) {
      types.push('malicious');
    }

    return types;
  }

  /**
   * Check if AbuseIPDB API is available and configured
   *
   * @returns True if API is available
   */
  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    try {
      // Test with a known-good IP (Google DNS)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}/check?ipAddress=8.8.8.8&maxAgeInDays=1`, {
        method: 'GET',
        headers: {
          Key: this.apiKey,
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      logger.error({ error }, 'AbuseIPDB availability check failed');
      return false;
    }
  }

  /**
   * Get rate limit information
   *
   * @returns Rate limit details
   */
  getRateLimit(): { requests_per_day: number; requests_per_hour: number } {
    return { ...this.rateLimit };
  }

  /**
   * Get configuration status
   *
   * @returns True if API key is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }
}
