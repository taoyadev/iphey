/**
 * IPbot lookup service
 *
 * Worker-compatible wrapper around the IPbot client:
 * - Clean results are cached for the configured clean TTL (defaulted by caller)
 * - High-risk results are cached for the configured high-risk TTL so flagged IPs
 *   are re-evaluated sooner
 * - Concurrent lookups for the same IP are de-duplicated into one upstream call
 */

import { logger } from '../utils/logger';
import { requestDeduplicator } from '../utils/requestDeduplication';
import { fetchIpbotIp, type IpbotClientOptions } from '../clients/ipbotClient';
import type { CacheAdapter } from '../utils/cacheInterface';
import type { NormalizedIpInsight } from '../types/ip';
import type { IpbotLookupResponse, IpbotResult } from '../types/ipbot';

const HIGH_RISK_RISK_SCORE = 70;
const HIGH_RISK_BANDS = new Set(['suspicious', 'bad', 'malicious', 'high', 'critical']);
const HIGH_RISK_VERDICTS = new Set(['block', 'deny', 'challenge', 'review']);
const HIGH_RISK_THREAT_LEVELS = new Set(['high', 'critical']);

const lower = (value: unknown): string => String(value ?? '').toLowerCase();

export interface IpbotLookupServiceOptions {
  cache: CacheAdapter<IpbotResult>;
  client: IpbotClientOptions;
  cleanTtlMs: number;
  highRiskTtlMs: number;
  cachePrefix?: string;
  fetchIpbot?: typeof fetchIpbotIp;
}

/**
 * Decide whether a lookup result is "high risk". Defensive across the several
 * signals IPbot may return: numeric score, band, verdict, threat level, or
 * proxy/vpn/tor classification flags.
 */
export function isHighRisk(data: IpbotLookupResponse): boolean {
  const score = data.score ?? {};
  const cls = data.classification ?? {};

  if (typeof score.risk_score === 'number' && score.risk_score >= HIGH_RISK_RISK_SCORE) return true;
  if (score.band && HIGH_RISK_BANDS.has(lower(score.band))) return true;
  if (score.verdict && HIGH_RISK_VERDICTS.has(lower(score.verdict))) return true;
  if (score.recommended_action && HIGH_RISK_VERDICTS.has(lower(score.recommended_action))) return true;
  if (cls.threat_level && HIGH_RISK_THREAT_LEVELS.has(lower(cls.threat_level))) return true;
  if (cls.is_proxy === true || cls.is_vpn === true || cls.is_tor === true) return true;

  return false;
}

export function ipbotTtlMs(data: IpbotLookupResponse, cleanTtlMs: number, highRiskTtlMs: number): number {
  return isHighRisk(data) ? highRiskTtlMs : cleanTtlMs;
}

export function normalizeIpbot(result: IpbotResult): NormalizedIpInsight {
  const data = result.data;
  const location = data.location ?? {};
  const network = data.network ?? {};
  const classification = data.classification ?? {};
  const score = data.score ?? {};

  const riskReasons = [
    classification.is_proxy ? 'Proxy detected' : undefined,
    classification.is_vpn ? 'VPN detected' : undefined,
    classification.is_tor ? 'Tor exit node detected' : undefined,
    classification.is_datacenter ? 'Datacenter IP' : undefined,
    classification.threat_level && lower(classification.threat_level) !== 'low'
      ? `Threat level: ${classification.threat_level}`
      : undefined,
    score.band && lower(score.band) !== 'good' ? `IPbot band: ${score.band}` : undefined,
    score.verdict && lower(score.verdict) !== 'allow' ? `IPbot verdict: ${score.verdict}` : undefined,
    score.recommended_action && lower(score.recommended_action) !== 'allow'
      ? `IPbot action: ${score.recommended_action}`
      : undefined,
    ...(data.evidence?.signals ?? []).map(signal => signal.label ?? signal.category).filter(Boolean),
  ].filter((value): value is string => Boolean(value));

  return {
    ip: data.ip,
    city: location.city,
    region: location.region,
    country: location.country_code ?? location.country,
    postal: location.postal,
    timezone: location.timezone,
    latitude: location.latitude,
    longitude: location.longitude,
    org: network.org ?? network.operator ?? network.service_name ?? network.owner,
    asn: network.asn,
    networkType: classification.usage_type ?? network.category ?? network.operator_type,
    privacy: {
      vpn: classification.is_vpn,
      proxy: classification.is_proxy,
      tor: classification.is_tor,
      hosting: classification.is_datacenter,
      service: classification.usage_type,
    },
    riskScore: score.risk_score ?? (isHighRisk(data) ? HIGH_RISK_RISK_SCORE : 10),
    riskReasons: [...new Set(riskReasons)],
    anycast: classification.is_anycast,
    source: 'ipbot',
    fetchedAt: result.fetchedAt,
  };
}

export function createIpbotLookupService(options: IpbotLookupServiceOptions) {
  const cachePrefix = options.cachePrefix ?? 'ipbot';
  const upstream = options.fetchIpbot ?? fetchIpbotIp;
  const cacheKey = (ip: string): string => `${cachePrefix}:${ip}`;

  const lookupIP = async (ip: string): Promise<IpbotResult> => {
    const key = cacheKey(ip);

    const cached = await options.cache.get(key);
    if (cached) {
      logger.debug({ ip }, 'IPbot cache hit');
      return cached.data;
    }

    return requestDeduplicator.deduplicate(key, async () => {
      const populated = await options.cache.get(key);
      if (populated) {
        return populated.data;
      }

      const result = await upstream(ip, options.client);
      const ttl = ipbotTtlMs(result.data, options.cleanTtlMs, options.highRiskTtlMs);

      await options.cache.set(key, result, ttl, ttl);

      logger.info(
        {
          ip,
          highRisk: isHighRisk(result.data),
          ttlMs: ttl,
          rateLimitRemaining: result.rateLimit.remaining,
          rateLimitTier: result.rateLimit.tier,
        },
        'IPbot lookup cached'
      );

      return result;
    });
  };

  return {
    lookupIP,
  };
}
