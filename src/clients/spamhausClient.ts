/**
 * Spamhaus DNSBL Client
 * Provides spam/malware detection using Spamhaus DNS-based blacklists
 *
 * DNS Blacklist Documentation: https://www.spamhaus.org/zen/
 * Uses DNS-over-HTTPS (Cloudflare) for queries
 */

import type { ThreatIntelResult, SpamhausDNSResponse } from '../types/threat';
import { logger } from '../utils/logger';

export class SpamhausClient {
  private readonly dnsBlacklists = [
    'zen.spamhaus.org', // Combined list (recommended)
    'sbl.spamhaus.org', // Spamhaus Block List (spam sources)
    'xbl.spamhaus.org', // Exploits Block List (hijacked/compromised machines)
  ];
  private readonly dnsOverHttpsUrl = 'https://cloudflare-dns.com/dns-query';
  private readonly timeout = 3000; // 3 seconds
  private readonly rateLimit = { requests_per_day: 10000, requests_per_hour: 417 };

  /**
   * Check IP against Spamhaus DNS blacklists
   *
   * @param ip - IP address to check
   * @returns Threat intelligence result
   */
  async checkIP(ip: string): Promise<ThreatIntelResult> {
    try {
      const reversedIP = this.reverseIPv4(ip);
      if (!reversedIP) {
        return {
          source: 'Spamhaus',
          is_listed: false,
          threat_types: [],
          confidence: 0,
          error: 'Invalid IPv4 format (IPv6 not supported for DNSBL)',
        };
      }

      // Check against multiple blacklists in parallel
      const checkPromises = this.dnsBlacklists.map(bl => this.checkDNSBL(reversedIP, bl));

      const results = await Promise.allSettled(checkPromises);

      // Determine if listed in any blacklist
      const isListed = results.some(r => r.status === 'fulfilled' && r.value === true);

      const listedCount = results.filter(r => r.status === 'fulfilled' && r.value === true).length;

      const result: ThreatIntelResult = {
        source: 'Spamhaus',
        is_listed: isListed,
        threat_types: isListed ? ['spam', 'malware', 'botnet'] : [],
        confidence: isListed ? 0.95 : 0.05,
        last_checked: new Date().toISOString(),
        list_type: 'DNSBL',
        reports: listedCount,
      };

      logger.debug({ ip, isListed, listedCount }, 'Spamhaus check completed');
      return result;
    } catch (error) {
      logger.error({ ip, error }, 'Spamhaus check failed');
      return {
        source: 'Spamhaus',
        is_listed: false,
        threat_types: [],
        confidence: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Reverse IPv4 address for DNS blacklist query
   *
   * @param ip - IP address in standard format (e.g., "192.0.2.1")
   * @returns Reversed IP (e.g., "1.2.0.192") or null if invalid
   */
  private reverseIPv4(ip: string): string | null {
    // Simple IPv4 validation and reversal
    const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = ip.match(ipv4Pattern);

    if (!match) {
      return null;
    }

    // Validate each octet (0-255)
    const octets = match.slice(1, 5).map(Number);
    if (octets.some(octet => octet < 0 || octet > 255)) {
      return null;
    }

    // Reverse the octets
    return octets.reverse().join('.');
  }

  /**
   * Check IP against a specific DNS blacklist
   *
   * @param reversedIP - Reversed IP address
   * @param blacklist - Blacklist domain
   * @returns True if listed, false otherwise
   */
  private async checkDNSBL(reversedIP: string, blacklist: string): Promise<boolean> {
    try {
      const query = `${reversedIP}.${blacklist}`;
      const url = `${this.dnsOverHttpsUrl}?name=${encodeURIComponent(query)}&type=A`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        headers: {
          Accept: 'application/dns-json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return false;
      }

      const data: SpamhausDNSResponse = await response.json();

      // Status 0 = NOERROR (IP is listed)
      // Status 3 = NXDOMAIN (IP is not listed)
      // Any answer indicates the IP is listed
      const isListed = !!(data.Status === 0 && data.Answer && data.Answer.length > 0);

      if (isListed) {
        logger.debug({ reversedIP, blacklist }, 'IP listed in Spamhaus blacklist');
      }

      return isListed;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        logger.debug({ reversedIP, blacklist }, 'Spamhaus DNSBL check timeout');
      } else {
        logger.debug({ reversedIP, blacklist, error }, 'Spamhaus DNSBL check error');
      }
      // Timeout or DNS error means not listed (fail-safe)
      return false;
    }
  }

  /**
   * Check if Spamhaus DNS service is available
   *
   * @returns True if service is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Test with reversed Google DNS IP (shouldn't be listed)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.dnsOverHttpsUrl}?name=8.8.8.8.zen.spamhaus.org&type=A`, {
        headers: { Accept: 'application/dns-json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      logger.error({ error }, 'Spamhaus availability check failed');
      return false;
    }
  }

  /**
   * Get rate limit information
   *
   * Note: Spamhaus doesn't have official limits for public DNS queries,
   * but we should be conservative to avoid being blocked
   *
   * @returns Rate limit details
   */
  getRateLimit(): { requests_per_day: number; requests_per_hour: number } {
    return { ...this.rateLimit };
  }

  /**
   * Get supported blacklists
   *
   * @returns Array of blacklist domains
   */
  getBlacklists(): string[] {
    return [...this.dnsBlacklists];
  }
}
