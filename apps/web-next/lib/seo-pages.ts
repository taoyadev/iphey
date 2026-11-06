import type { ASNAnalysis, EnhancedIPResponse } from '@/types/report';
import { fetchASNAnalysis, fetchEnhancedIP } from '@/lib/api';
import { ASN_SEED_REGISTRY, IP_SEED_FALLBACKS } from '@/lib/seo-data';

const fallbackIpResponse = (ip: string): EnhancedIPResponse => ({
  ip,
  geolocation: {
    ip,
    city: IP_SEED_FALLBACKS[ip]?.city || 'Unknown',
    region: IP_SEED_FALLBACKS[ip]?.region || 'Unknown',
    country: IP_SEED_FALLBACKS[ip]?.country || 'Unknown',
    postal: 'Unknown',
    timezone: IP_SEED_FALLBACKS[ip]?.timezone || 'Unknown',
    latitude: 0,
    longitude: 0,
    org: IP_SEED_FALLBACKS[ip]?.org || 'Unknown Organization',
    asn: IP_SEED_FALLBACKS[ip] ? `AS${IP_SEED_FALLBACKS[ip].asn}` : 'Unknown',
    source: 'static-fallback',
    fetchedAt: Date.now(),
  },
  risk_assessment: {
    overall_score: IP_SEED_FALLBACKS[ip]?.riskScore || 5,
    overall_level:
      (IP_SEED_FALLBACKS[ip]?.riskScore || 5) >= 70
        ? 'high'
        : (IP_SEED_FALLBACKS[ip]?.riskScore || 5) >= 35
          ? 'medium'
          : 'low',
    factors: IP_SEED_FALLBACKS[ip]?.riskFactors || ['Live provider lookup unavailable during static generation'],
    recommendation: IP_SEED_FALLBACKS[ip]
      ? 'Static seed fallback used during build. Re-run the live inspector for current provider data.'
      : 'Use the main inspector for a fresh lookup.',
  },
  asn_analysis: {
    asn: IP_SEED_FALLBACKS[ip]?.asn || 0,
    info: {
      asn: IP_SEED_FALLBACKS[ip]?.asn || 0,
      name: IP_SEED_FALLBACKS[ip]?.org || 'Unknown Organization',
      org_name: IP_SEED_FALLBACKS[ip]?.org || 'Unknown Organization',
      country: IP_SEED_FALLBACKS[ip]?.country || 'Unknown',
      description: IP_SEED_FALLBACKS[ip]
        ? `Static seed profile for ${IP_SEED_FALLBACKS[ip].org}.`
        : 'Static fallback generated during build.',
      network_type: IP_SEED_FALLBACKS[ip]?.networkType || 'unknown',
    },
    timestamp: new Date().toISOString(),
  },
  sources_used: ['static-fallback'],
  analysis_timestamp: new Date().toISOString(),
});

export async function getStaticIpPageData(ip: string) {
  try {
    return await fetchEnhancedIP(ip, { includeASN: true, includeThreat: true });
  } catch {
    return fallbackIpResponse(ip);
  }
}

export async function getStaticAsnPageData(asn: number): Promise<ASNAnalysis & { sampleIps: string[] }> {
  const registry = ASN_SEED_REGISTRY.find(entry => entry.asn === asn);

  try {
    const live = await fetchASNAnalysis(asn);
    return {
      ...live,
      sampleIps: registry?.sampleIps || [],
    };
  } catch {
    return {
      asn,
      info: {
        asn,
        name: registry?.name || `ASN ${asn}`,
        org_name: registry?.orgName || `ASN ${asn}`,
        country: registry?.country || 'Unknown',
        description: registry?.description || `Static profile for ASN ${asn}.`,
        network_type: registry?.networkType || 'unknown',
      },
      timestamp: new Date().toISOString(),
      sampleIps: registry?.sampleIps || [],
    };
  }
}
