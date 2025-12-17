/**
 * ASN Analysis Service
 * Provides comprehensive Autonomous System Number analysis
 * Integrates multiple data sources for deep network infrastructure insights
 */

import { CloudflareRadarASNClient } from '../clients/cloudflareRadarASNClient';
import type { ASNAnalysisResult } from '../types/asn';
import { logger } from '../utils/logger';

/**
 * Extract ASN from IP info or string
 */
export function extractASN(input: string | number | undefined): number | null {
  if (!input) return null;

  // If already a number, return it
  if (typeof input === 'number') {
    return input > 0 ? input : null;
  }

  // If string, try to parse ASN number
  const str = String(input);

  // Match patterns like "AS15169", "ASN15169", or just "15169"
  const matches = str.match(/(?:AS|ASN)?(\d+)/i);
  if (matches && matches[1]) {
    const asn = parseInt(matches[1], 10);
    return asn > 0 ? asn : null;
  }

  return null;
}

/**
 * ASN Analysis Service
 * Coordinates ASN data retrieval and analysis from multiple sources
 */
export class ASNService {
  private readonly radarClient: CloudflareRadarASNClient;

  constructor() {
    this.radarClient = new CloudflareRadarASNClient();
  }

  /**
   * Get comprehensive ASN analysis
   *
   * @param asn - Autonomous System Number
   * @returns Complete ASN analysis with network details
   */
  async analyzeASN(asn: number): Promise<ASNAnalysisResult> {
    try {
      logger.info({ asn }, 'Starting comprehensive ASN analysis');

      // Validate ASN
      if (!asn || asn <= 0) {
        throw new Error(`Invalid ASN: ${asn}`);
      }

      // Get analysis from Cloudflare Radar
      const result = await this.radarClient.analyzeASN(asn);

      logger.info(
        {
          asn,
          name: result.info.name,
          prefixCount: result.prefixes?.length || 0,
        },
        'ASN analysis completed successfully'
      );

      return result;
    } catch (error) {
      logger.error({ asn, error }, 'ASN analysis failed');
      throw error;
    }
  }

  /**
   * Get ASN from IP address using existing IP lookup services
   * This is a helper method that extracts ASN from IP geolocation data
   *
   * @param ip - IP address
   * @returns ASN number or null
   */
  async getASNFromIP(ip: string): Promise<number | null> {
    try {
      // This would typically integrate with ipinfo or radar IP lookup
      // For now, we return null and let the caller handle IP->ASN lookup
      logger.debug({ ip }, 'ASN from IP lookup not yet implemented');
      return null;
    } catch (error) {
      logger.error({ ip, error }, 'Failed to get ASN from IP');
      return null;
    }
  }

  /**
   * Check if ASN analysis service is available
   *
   * @returns True if service is configured and available
   */
  async isAvailable(): Promise<boolean> {
    if (!this.radarClient.isConfigured()) {
      logger.debug('ASN service not configured (missing Cloudflare credentials)');
      return false;
    }

    try {
      const available = await this.radarClient.isAvailable();
      logger.debug({ available }, 'ASN service availability check');
      return available;
    } catch (error) {
      logger.error({ error }, 'ASN service availability check failed');
      return false;
    }
  }

  /**
   * Get service status
   *
   * @returns Service configuration and availability status
   */
  async getStatus(): Promise<{
    configured: boolean;
    available: boolean;
    provider: string;
  }> {
    const configured = this.radarClient.isConfigured();
    const available = configured ? await this.radarClient.isAvailable() : false;

    return {
      configured,
      available,
      provider: 'Cloudflare Radar',
    };
  }
}
