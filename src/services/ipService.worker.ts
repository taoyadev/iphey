import { logger } from '../utils/logger';
import { ipInsightSchema } from '../schemas/ipInsight';
import { RequestDeduplicator } from '../utils/requestDeduplication';
import { ApiError } from '../utils/apiError';
import { parseIP } from '../utils/networkInput';
import type { Env } from '../worker/types';
import type { IpInfoDetails, NormalizedIpInsight, RadarIpResponse } from '../types/ip';
import { normalizeIpInfo, normalizeRadar } from './ipNormalization';
import { ipbotTtlMs, normalizeIpbot } from './ipbotService';
import { fetchIpbotIp } from '../clients/ipbotClient';
import { createCache } from '../utils/cacheFactory.worker';

const positive = (value: string | undefined, fallback: number) =>
  Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : fallback;

export const createWorkerIpService = (env: Env) => {
  const ttlMs = positive(env.CACHE_TTL_MS, 300000);
  const staleTtlMs = Math.max(ttlMs, positive(env.CACHE_STALE_TTL_MS, 1800000));
  const ipCache = createCache<NormalizedIpInsight>('ip-insight', env.IP_CACHE, {
    backend: env.CACHE_BACKEND === 'kv' ? 'kv' : 'memory',
    ttlMs,
    staleTtlMs,
  });
  const cleanIpbotTtlMs = positive(env.CACHE_TTL_IPBOT_MS, 86400000);
  const highRiskIpbotTtlMs = positive(env.CACHE_TTL_IPBOT_HIGH_RISK_MS, 3600000);
  const pending = new RequestDeduplicator();
  let lastSuccessAt: number | null = null;

  async function fetchJson<T>(url: string, headers: Record<string, string>, total: AbortSignal): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Math.min(2500, positive(env.CLIENT_TIMEOUT_MS, 2500)));
    try {
      const response = await fetch(url, { headers, signal: AbortSignal.any([total, controller.signal]) });
      if (!response.ok) throw new Error('Provider returned an error');
      return (await response.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }

  const lookupIpInsight = async (input: string, signal?: AbortSignal): Promise<NormalizedIpInsight> => {
    signal?.throwIfAborted();
    const parsed = parseIP(input);
    if (!parsed) throw new ApiError(400, 'Invalid IP address');
    if (parsed.category !== 'public')
      throw new ApiError(422, 'This special-use address has no public geolocation', { category: parsed.category });
    const ip = parsed.ip;
    const key = `ip-observed-v2:${ip}`;
    return pending.deduplicate(
      key,
      async sharedSignal => {
        sharedSignal.throwIfAborted();
        const cacheResult = await ipCache.getWithStale(key);
        const cachedData = ipInsightSchema.safeParse(cacheResult.entry?.data);
        const maximumAge =
          cachedData.success && cachedData.data.source === 'ipbot'
            ? Math.max(cleanIpbotTtlMs, highRiskIpbotTtlMs, staleTtlMs)
            : staleTtlMs;
        const cached =
          cachedData.success &&
          parseIP(cachedData.data.ip)?.ip === ip &&
          cachedData.data.fetchedAt <= Date.now() &&
          Date.now() - cachedData.data.fetchedAt <= maximumAge
            ? cacheResult
            : { entry: null, isStale: false };
        sharedSignal.throwIfAborted();
        if (cached.entry && !cached.isStale) return { ...cached.entry.data, cacheStatus: 'fresh' };
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 7500);
        const upstreamSignal = AbortSignal.any([sharedSignal, controller.signal]);
        let insight: NormalizedIpInsight | null = null;
        let ipbotFreshTtl: number | undefined;
        try {
          if (env.IPBOT_API_KEY) {
            try {
              const ipbot = await fetchIpbotIp(ip, {
                origin: env.IPBOT_API_ORIGIN ?? 'https://api.ipbot.com',
                apiKey: env.IPBOT_API_KEY,
                timeoutMs: Math.min(2500, positive(env.IPBOT_TIMEOUT_MS, 2500)),
                maxRetries: 0,
                signal: upstreamSignal,
              });
              insight = normalizeIpbot(ipbot);
              ipbotFreshTtl = ipbotTtlMs(ipbot.data, cleanIpbotTtlMs, highRiskIpbotTtlMs);
              if (parseIP(insight.ip)?.ip !== ip || !ipInsightSchema.safeParse(insight).success) insight = null;
            } catch {
              logger.warn('IPbot lookup unavailable');
            }
          }
          if (!insight && env.IPINFO_TOKEN && !upstreamSignal.aborted) {
            try {
              insight = normalizeIpInfo(
                await fetchJson<IpInfoDetails>(
                  `https://ipinfo.io/${encodeURIComponent(ip)}/json?token=${env.IPINFO_TOKEN}`,
                  { Accept: 'application/json' },
                  upstreamSignal
                )
              );
              if (parseIP(insight.ip)?.ip !== ip || !ipInsightSchema.safeParse(insight).success) insight = null;
            } catch {
              logger.warn('IPinfo lookup unavailable');
            }
          }
          if (!insight && env.CLOUDFLARE_ACCOUNT_ID && env.CLOUDFLARE_RADAR_TOKEN && !upstreamSignal.aborted) {
            try {
              const data = await fetchJson<{ success: boolean; result: RadarIpResponse }>(
                `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/intelligence/ip?ip=${encodeURIComponent(ip)}`,
                { Authorization: `Bearer ${env.CLOUDFLARE_RADAR_TOKEN}` },
                upstreamSignal
              );
              if (data.success) insight = normalizeRadar(data.result);
              if (insight && (parseIP(insight.ip)?.ip !== ip || !ipInsightSchema.safeParse(insight).success))
                insight = null;
            } catch {
              logger.warn('Radar lookup unavailable');
            }
          }
        } finally {
          clearTimeout(timer);
        }
        sharedSignal.throwIfAborted();
        if (!insight) {
          if (cached.entry && cached.entry.expiresAt > Date.now())
            return { ...cached.entry.data, cacheStatus: 'stale', refreshFailed: true };
          throw new ApiError(503, 'IP data is unavailable', { code: 'IP_DATA_UNAVAILABLE', retryable: true });
        }
        lastSuccessAt = Date.now();
        const fresh = insight.source === 'ipbot' ? ipbotFreshTtl! : ttlMs;
        try {
          await ipCache.set(key, insight, fresh, Math.max(fresh, staleTtlMs));
        } catch {
          logger.warn('Cache write unavailable; preserving provider result');
        }
        sharedSignal.throwIfAborted();
        return { ...insight, cacheStatus: 'fresh' };
      },
      signal
    );
  };

  return {
    lookupIpInsight,
    // Status reflects this instance's observations, never credentials-as-health.
    status: () => ({ status: lastSuccessAt ? 'observed' : 'unknown', lastSuccessAt }),
    hasIpbot: Boolean(env.IPBOT_API_KEY),
  };
};
