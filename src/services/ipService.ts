import { ApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { createCache } from '../utils/cacheFactory';
import { requestDeduplicator } from '../utils/requestDeduplication';
import type { NormalizedIpInsight } from '../types/ip';
import { fetchIpInfo } from '../clients/ipinfoClient';
import { fetchRadarIp } from '../clients/cloudflareRadarClient';
import { config } from '../config';
import { normalizeIpInfo, normalizeRadar } from './ipNormalization';

const ipCache = createCache<NormalizedIpInsight>('ip-insight');

/**
 * Background revalidation function
 * Fetches fresh IP data and updates cache without blocking
 */
async function revalidateIpInsight(ip: string): Promise<void> {
  try {
    let insight: NormalizedIpInsight | null = null;

    if (config.IPINFO_TOKEN) {
      try {
        const ipinfo = await fetchIpInfo(ip);
        if (ipinfo) {
          insight = normalizeIpInfo(ipinfo);
        }
      } catch (error) {
        logger.warn({ err: error }, 'ipinfo revalidation failed');
      }
    }

    if (!insight && config.CLOUDFLARE_ACCOUNT_ID && config.CLOUDFLARE_RADAR_TOKEN) {
      try {
        const radar = await fetchRadarIp(ip);
        if (radar) {
          insight = normalizeRadar(radar);
        }
      } catch (error) {
        logger.warn({ err: error }, 'Cloudflare Radar revalidation failed');
      }
    }

    if (insight) {
      await ipCache.set(ip, insight);
      logger.debug({ ip }, 'Background revalidation completed');
    }
  } catch (error) {
    logger.warn({ err: error, ip }, 'Background revalidation error');
  }
}

export async function lookupIpInsight(ip: string): Promise<NormalizedIpInsight> {
  // Check cache with stale-while-revalidate
  const { entry: cached, isStale } = await ipCache.getWithStale(ip);

  if (cached) {
    // If stale, trigger background revalidation (non-blocking)
    if (isStale) {
      logger.debug({ ip }, 'Serving stale data, revalidating in background');
      // Fire and forget - don't await
      revalidateIpInsight(ip).catch(error => {
        logger.warn({ err: error, ip }, 'Background revalidation failed');
      });
    }
    return cached.data;
  }

  // No cache hit, fetch synchronously with deduplication
  return requestDeduplicator.deduplicate(`ip:${ip}`, async () => {
    // Double-check cache (another request might have populated it)
    const { entry: cachedAfterLock } = await ipCache.getWithStale(ip);
    if (cachedAfterLock) {
      return cachedAfterLock.data;
    }

    let insight: NormalizedIpInsight | null = null;

    if (config.IPINFO_TOKEN) {
      try {
        const ipinfo = await fetchIpInfo(ip);
        if (ipinfo) {
          insight = normalizeIpInfo(ipinfo);
        }
      } catch (error) {
        logger.warn({ err: error }, 'ipinfo lookup failed');
      }
    }

    if (!insight && config.CLOUDFLARE_ACCOUNT_ID && config.CLOUDFLARE_RADAR_TOKEN) {
      try {
        const radar = await fetchRadarIp(ip);
        if (radar) {
          insight = normalizeRadar(radar);
        }
      } catch (error) {
        logger.warn({ err: error }, 'Cloudflare Radar lookup failed');
      }
    }

    if (!insight) {
      throw new ApiError(502, 'Unable to fetch IP intelligence');
    }

    await ipCache.set(ip, insight);
    return insight;
  });
}
