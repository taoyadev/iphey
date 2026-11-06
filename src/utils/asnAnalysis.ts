import { ApiError } from './apiError';
import { parseASN, asnCategory } from './networkInput';
import type { NormalizedIpInsight } from '../types/ip';

interface AsnCatalogEntry {
  name: string;
  orgName: string;
  country: string;
  description: string;
  networkType?: string;
}

const ASN_CATALOG: Record<number, AsnCatalogEntry> = {
  13335: {
    name: 'Cloudflare',
    orgName: 'Cloudflare, Inc.',
    country: 'US',
    description: 'Global edge network commonly seen on CDN, DNS, and reverse proxy traffic.',
    networkType: 'anycast edge',
  },
  15169: {
    name: 'Google',
    orgName: 'Google LLC',
    country: 'US',
    description: 'Google backbone and public service network used for search, DNS, and cloud products.',
    networkType: 'hyperscale backbone',
  },
  16509: {
    name: 'Amazon',
    orgName: 'Amazon.com, Inc.',
    country: 'US',
    description: 'Amazon network footprint spanning AWS hosting, CDN, and consumer services.',
    networkType: 'cloud hosting',
  },
  8075: {
    name: 'Microsoft',
    orgName: 'Microsoft Corporation',
    country: 'US',
    description: 'Microsoft global network serving Azure, enterprise services, and consumer traffic.',
    networkType: 'cloud hosting',
  },
  24940: {
    name: 'Hetzner',
    orgName: 'Hetzner Online GmbH',
    country: 'DE',
    description: 'European hosting provider often seen in automation, VPN, and server workloads.',
    networkType: 'hosting provider',
  },
  14061: {
    name: 'DigitalOcean',
    orgName: 'DigitalOcean, LLC',
    country: 'US',
    description: 'Developer-focused cloud infrastructure network.',
    networkType: 'cloud hosting',
  },
  14618: {
    name: 'Amazon-AES',
    orgName: 'Amazon.com, Inc.',
    country: 'US',
    description: 'Amazon service edge network, often tied to infrastructure and retail traffic.',
    networkType: 'cloud infrastructure',
  },
};

export const parseAsnNumber = (asn: string | number | undefined): number => parseASN(asn) ?? 0;

export const buildAsnAnalysis = (
  asn: number,
  insight?: Partial<NormalizedIpInsight>,
  timestamp = new Date().toISOString()
) => {
  const catalogEntry = ASN_CATALOG[asn];
  const orgName = insight?.org || catalogEntry?.orgName || 'Unknown Organization';
  const country = catalogEntry?.country; // Registration country is not IP geolocation.
  const networkType = insight?.networkType || catalogEntry?.networkType || 'unknown';

  return {
    asn,
    status: asnCategory(asn) !== 'public' ? 'special-use' : catalogEntry || insight?.org ? 'success' : 'no-result',
    category: asnCategory(asn),
    source: insight?.org && !catalogEntry ? 'ip-provider' : 'built-in-directory',
    sourceDate: null,
    info: {
      asn,
      name: catalogEntry?.name || orgName,
      org_name: orgName,
      country,
      description: catalogEntry?.description || `${orgName} network profile for ASN ${asn}.`,
      network_type: networkType,
    },
    timestamp,
  };
};

export const buildEnhancedIpResponse = (
  ip: string,
  insight: Partial<NormalizedIpInsight>,
  timestamp = new Date().toISOString()
) => {
  const asnNumber = parseAsnNumber(insight.asn);
  const riskScore = insight.riskScore;
  if (riskScore === undefined)
    throw new ApiError(503, 'Risk assessment is unavailable; use the observation API for partial data');

  return {
    ip,
    geolocation: {
      ip,
      city: insight.city || 'Unknown',
      region: insight.region || 'Unknown',
      country: insight.country || 'Unknown',
      postal: insight.postal || 'Unknown',
      timezone: insight.timezone || 'Unknown',
      latitude: insight.latitude,
      longitude: insight.longitude,
      org: insight.org || 'Unknown',
      asn: insight.asn || 'Unknown',
      source: insight.source,
      fetchedAt: insight.fetchedAt,
      anycast: insight.anycast,
      bogon: insight.bogon,
    },
    asn_analysis: buildAsnAnalysis(asnNumber, insight, timestamp),
    risk_assessment: {
      overall_score: riskScore,
      overall_level: riskScore > 50 ? 'high' : riskScore > 25 ? 'medium' : 'low',
      factors: insight.riskReasons || [],
      recommendation:
        'Provider score only. Consult its scale and evidence; this is not a safety or maliciousness determination.',
    },
    privacy: insight.privacy || null,
    sources_used: insight.source ? [insight.source] : [],
    analysis_timestamp: timestamp,
  };
};
