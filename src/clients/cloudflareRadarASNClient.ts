/**
 * Cloudflare Radar ASN Client
 * Provides deep analysis of Autonomous System Numbers (ASN)
 *
 * API Documentation: https://developers.cloudflare.com/api/operations/radar-get-asn-details
 */

import type {
  ASNAnalysisResult,
  RadarASNInfo,
  NetworkPrefix,
  CloudflareRadarASNResponse,
  CloudflareRadarASNPrefixesResponse,
} from '../types/asn';
import { logger } from '../utils/logger';
import { config } from '../config';

export class CloudflareRadarASNClient {
  private readonly baseUrl = 'https://api.cloudflare.com/client/v4';
  private readonly timeout = 5000; // 5 seconds

  /**
   * Get authorization headers for Cloudflare API
   */
  private getHeaders(): Record<string, string> {
    if (!config.CLOUDFLARE_RADAR_TOKEN) {
      throw new Error('Cloudflare Radar token not configured');
    }
    return {
      Authorization: `Bearer ${config.CLOUDFLARE_RADAR_TOKEN}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Analyze ASN in depth
   *
   * @param asn - Autonomous System Number
   * @returns Comprehensive ASN analysis
   */
  async analyzeASN(asn: number): Promise<ASNAnalysisResult> {
    try {
      logger.info({ asn }, 'Starting ASN analysis');

      // Fetch ASN details and prefixes in parallel
      const [asnInfo, prefixes] = await Promise.all([this.getASNInfo(asn), this.getASNPrefixes(asn)]);

      const result: ASNAnalysisResult = {
        asn,
        info: asnInfo,
        prefixes,
        last_updated: new Date().toISOString(),
      };

      logger.info({ asn, prefixCount: prefixes.length }, 'ASN analysis completed');
      return result;
    } catch (error) {
      logger.error({ asn, error }, 'ASN analysis failed');
      throw error;
    }
  }

  /**
   * Get basic ASN information
   *
   * @param asn - Autonomous System Number
   * @returns ASN basic info
   */
  async getASNInfo(asn: number): Promise<RadarASNInfo> {
    try {
      // Use public Radar API instead of Intel API
      const url = `${this.baseUrl}/radar/entities/asns/${asn}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Cloudflare Radar ASN API error: ${response.status} - ${errorText}`);
      }

      const data: CloudflareRadarASNResponse = await response.json();

      if (!data.success || !data.result || !data.result.asn) {
        throw new Error('Invalid API response: missing result field');
      }

      // Map Radar API response to our expected format
      const radarAsn = data.result.asn;
      const mappedResult: RadarASNInfo = {
        asn: radarAsn.asn,
        name: radarAsn.name,
        description: radarAsn.aka || radarAsn.orgName || undefined,
        country: radarAsn.country || undefined,
        org_name: radarAsn.orgName || radarAsn.name,
      };

      logger.debug({ asn, name: mappedResult.name }, 'ASN info retrieved');
      return mappedResult;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('ASN info request timeout');
      }
      throw error;
    }
  }

  /**
   * Get network prefixes (IP ranges) owned by ASN
   *
   * @param asn - Autonomous System Number
   * @returns Array of network prefixes
   */
  async getASNPrefixes(asn: number): Promise<NetworkPrefix[]> {
    try {
      const url = `${this.baseUrl}/accounts/${config.CLOUDFLARE_ACCOUNT_ID}/intel/asn/${asn}/subnets`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Prefixes endpoint might not be available for all ASNs
        logger.debug({ asn, status: response.status }, 'ASN prefixes not available');
        return [];
      }

      const data: CloudflareRadarASNPrefixesResponse = await response.json();

      if (!data.success || !data.result || !data.result.prefixes) {
        return [];
      }

      const prefixes: NetworkPrefix[] = data.result.prefixes.map(prefix => ({
        prefix: prefix.prefix,
        ip_version: prefix.ip_version,
        status: 'active',
      }));

      logger.debug({ asn, count: prefixes.length }, 'ASN prefixes retrieved');
      return prefixes;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        logger.debug({ asn }, 'ASN prefixes request timeout');
      } else {
        logger.debug({ asn, error }, 'ASN prefixes retrieval failed');
      }
      // Return empty array instead of throwing - prefixes are optional
      return [];
    }
  }

  /**
   * Check if Cloudflare Radar ASN service is available
   *
   * @returns True if service is available
   */
  async isAvailable(): Promise<boolean> {
    if (!config.CLOUDFLARE_ACCOUNT_ID || !config.CLOUDFLARE_RADAR_TOKEN) {
      return false;
    }

    try {
      // Test with a well-known ASN (Cloudflare's own: AS13335)
      await this.getASNInfo(13335);
      return true;
    } catch (error) {
      logger.error({ error }, 'Cloudflare Radar ASN availability check failed');
      return false;
    }
  }

  /**
   * Check if client is properly configured
   *
   * @returns True if configured
   */
  isConfigured(): boolean {
    return Boolean(config.CLOUDFLARE_ACCOUNT_ID && config.CLOUDFLARE_RADAR_TOKEN);
  }
}
