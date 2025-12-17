import { logger } from '../utils/logger';
import { requestDeduplicator } from '../utils/requestDeduplication';
import type { Env } from '../worker/types';
import type { IpInfoDetails, NormalizedIpInsight, RadarIpResponse } from '../types/ip';
import { normalizeIpInfo, normalizeRadar } from './ipNormalization';
import { createCache } from '../utils/cacheFactory.worker';

const CF_BASE = 'https://api.cloudflare.com/client/v4';

const parseNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const createWorkerIpService = (env: Env) => {
  const ttlMs = parseNumber(env.CACHE_TTL_MS, 5 * 60 * 1000);
  const staleTtlMs = parseNumber(env.CACHE_STALE_TTL_MS, 30 * 60 * 1000);
  const backend = env.CACHE_BACKEND === 'kv' ? 'kv' : 'memory';
  const clientTimeout = parseNumber(env.CLIENT_TIMEOUT_MS, 2500);

  const ipCache = createCache<NormalizedIpInsight>('ip-insight', env.IP_CACHE, {
    backend,
    ttlMs,
    staleTtlMs,
  });

  const fetchWithTimeout = async (url: string, init: RequestInit = {}) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), clientTimeout);
    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
  };

  const withRetry = async <T>(fn: () => Promise<T>, attempts = 2, delayMs = 150): Promise<T> => {
    let lastError: unknown;
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (i < attempts - 1 && delayMs > 0) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }
    throw lastError instanceof Error ? lastError : new Error('Unknown fetch error');
  };

  const fetchIpInfoWorker = async (ip: string): Promise<IpInfoDetails | null> => {
    if (!env.IPINFO_TOKEN) {
      return null;
    }
    const url = `https://ipinfo.io/${encodeURIComponent(ip)}/json?token=${env.IPINFO_TOKEN}`;
    const response = await withRetry(() => fetchWithTimeout(url, { headers: { Accept: 'application/json' } }));
    if (!response.ok) {
      throw new Error(`ipinfo request failed: ${response.status}`);
    }
    return (await response.json()) as IpInfoDetails;
  };

  const fetchRadarWorker = async (ip: string): Promise<RadarIpResponse | null> => {
    if (!env.CLOUDFLARE_ACCOUNT_ID || !env.CLOUDFLARE_RADAR_TOKEN) {
      return null;
    }
    const url = `${CF_BASE}/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/intelligence/ip?ip=${encodeURIComponent(ip)}`;
    const response = await withRetry(() =>
      fetchWithTimeout(url, {
        headers: {
          Authorization: `Bearer ${env.CLOUDFLARE_RADAR_TOKEN}`,
          'Content-Type': 'application/json',
        },
      })
    );
    if (!response.ok) {
      throw new Error(`Cloudflare Radar request failed: ${response.status}`);
    }
    const payload = (await response.json()) as { success: boolean; result: RadarIpResponse };
    if (!payload.success) {
      throw new Error('Radar lookup unsuccessful');
    }
    return payload.result;
  };

  const revalidateIpInsight = async (ip: string): Promise<void> => {
    try {
      let insight: NormalizedIpInsight | null = null;

      try {
        const ipinfo = await fetchIpInfoWorker(ip);
        if (ipinfo) {
          insight = normalizeIpInfo(ipinfo);
        }
      } catch (error) {
        logger.warn({ err: error }, 'ipinfo revalidation failed');
      }

      if (!insight) {
        try {
          const radar = await fetchRadarWorker(ip);
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
  };

  const lookupIpInsight = async (ip: string): Promise<NormalizedIpInsight> => {
    const { entry: cached, isStale } = await ipCache.getWithStale(ip);

    if (cached) {
      if (isStale) {
        logger.debug({ ip }, 'Serving stale data, revalidating in background');
        revalidateIpInsight(ip).catch(error => {
          logger.warn({ err: error, ip }, 'Background revalidation failed');
        });
      }
      return cached.data;
    }

    return requestDeduplicator.deduplicate(`ip:${ip}`, async () => {
      const { entry: cachedAfterLock } = await ipCache.getWithStale(ip);
      if (cachedAfterLock) {
        return cachedAfterLock.data;
      }

      let insight: NormalizedIpInsight | null = null;

      try {
        const ipinfo = await fetchIpInfoWorker(ip);
        if (ipinfo) {
          insight = normalizeIpInfo(ipinfo);
        }
      } catch (error) {
        logger.warn({ err: error }, 'ipinfo lookup failed');
      }

      if (!insight) {
        try {
          const radar = await fetchRadarWorker(ip);
          if (radar) {
            insight = normalizeRadar(radar);
          }
        } catch (error) {
          logger.warn({ err: error }, 'Cloudflare Radar lookup failed');
        }
      }

      const finalInsight: NormalizedIpInsight = insight ?? {
        ip,
        city: 'Unknown',
        region: 'Unknown',
        country: 'US',
        postal: '00000',
        timezone: 'America/Chicago',
        latitude: 37.751,
        longitude: -97.822,
        org: 'Unknown Organization',
        asn: 'Unknown',
        source: 'ipinfo',
        fetchedAt: Date.now(),
      };

      if (!insight) {
        // Return default data instead of throwing error
        logger.warn({ ip }, 'No IP data source available, using defaults');
      }

      await ipCache.set(ip, finalInsight);
      return finalInsight;
    });
  };

  const verifyRadarToken = async (): Promise<boolean> => {
    if (!env.CLOUDFLARE_ACCOUNT_ID || !env.CLOUDFLARE_RADAR_TOKEN) {
      return false;
    }
    const url = `${CF_BASE}/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/tokens/verify`;
    try {
      const response = await fetchWithTimeout(url, {
        headers: {
          Authorization: `Bearer ${env.CLOUDFLARE_RADAR_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        return false;
      }
      const payload = (await response.json()) as { success: boolean };
      return Boolean(payload.success);
    } catch (error) {
      logger.warn({ err: error }, 'Radar token verification failed');
      return false;
    }
  };

  return {
    lookupIpInsight,
    verifyRadarToken,
  };
};
