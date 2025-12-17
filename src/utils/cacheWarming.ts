/**
 * Cache Warming
 * Preloads frequently accessed IPs into cache during startup
 */

import { logger } from './logger';

/**
 * Common IPs to warm cache with
 * Includes public DNS servers, popular CDN IPs, and common service providers
 */
const COMMON_IPS = [
  // Google Public DNS
  '8.8.8.8',
  '8.8.4.4',

  // Cloudflare DNS
  '1.1.1.1',
  '1.0.0.1',

  // Quad9 DNS
  '9.9.9.9',

  // OpenDNS
  '208.67.222.222',
  '208.67.220.220',

  // Common CDN / Cloud Provider IPs (examples)
  '13.107.42.14', // Microsoft Azure
  '52.85.0.1', // AWS CloudFront
  '104.16.0.1', // Cloudflare

  // Popular VPN exit nodes (for risk detection testing)
  '185.220.101.1', // Tor exit
];

export interface CacheWarmingOptions {
  enabled: boolean;
  customIps?: string[];
  delayBetweenRequests?: number; // ms delay between warming requests
}

export class CacheWarmer {
  private isWarming = false;
  private warmedCount = 0;

  /**
   * Warm cache with common IPs
   * @param lookupFn - IP lookup function to use for warming
   * @param options - Warming options
   */
  async warmCache(
    lookupFn: (ip: string) => Promise<unknown>,
    options: CacheWarmingOptions = { enabled: true }
  ): Promise<void> {
    if (!options.enabled) {
      logger.info('Cache warming disabled');
      return;
    }

    if (this.isWarming) {
      logger.warn('Cache warming already in progress');
      return;
    }

    this.isWarming = true;
    this.warmedCount = 0;

    const ipsToWarm = [...COMMON_IPS, ...(options.customIps || [])];
    const delay = options.delayBetweenRequests || 100;

    logger.info({ count: ipsToWarm.length }, 'Starting cache warming');

    // Warm cache in background (non-blocking)
    this.warmInBackground(ipsToWarm, lookupFn, delay)
      .catch(error => {
        logger.error({ err: error }, 'Cache warming failed');
      })
      .finally(() => {
        this.isWarming = false;
      });
  }

  /**
   * Internal method to warm cache in background
   */
  private async warmInBackground(
    ips: string[],
    lookupFn: (ip: string) => Promise<unknown>,
    delay: number
  ): Promise<void> {
    for (const ip of ips) {
      try {
        await lookupFn(ip);
        this.warmedCount++;

        // Add delay to avoid overwhelming external APIs
        if (delay > 0 && this.warmedCount < ips.length) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (error) {
        logger.warn({ err: error, ip }, 'Failed to warm cache for IP');
      }
    }

    logger.info({ warmedCount: this.warmedCount, totalCount: ips.length }, 'Cache warming completed');
  }

  /**
   * Check if cache warming is in progress
   */
  isInProgress(): boolean {
    return this.isWarming;
  }

  /**
   * Get count of warmed entries
   */
  getWarmedCount(): number {
    return this.warmedCount;
  }
}

/**
 * Global cache warmer instance
 */
export const cacheWarmer = new CacheWarmer();
