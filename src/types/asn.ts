/**
 * ASN (Autonomous System Number) Type Definitions
 * For deep analysis of network infrastructure
 */

/**
 * ASN basic information from Cloudflare Radar
 */
export interface RadarASNInfo {
  asn: number;
  name: string;
  org_name?: string;
  description?: string;
  country?: string;
}

/**
 * Network prefix information (IP ranges owned by ASN)
 */
export interface NetworkPrefix {
  prefix: string;
  ip_version: 4 | 6;
  first_seen?: string;
  last_seen?: string;
  status?: 'active' | 'inactive';
}

/**
 * Geographic distribution of ASN
 */
export interface ASNGeography {
  country: string;
  region?: string;
  city_count?: number;
  percentage?: number;
}

/**
 * Related domain information
 */
export interface RelatedDomain {
  domain: string;
  rank?: number;
  category?: string;
}

/**
 * ASN reputation and traffic metrics
 */
export interface ASNMetrics {
  reputation_score?: number;
  reputation_level?: 'good' | 'neutral' | 'poor';
  traffic_rank?: number;
  threat_score?: number;
  spam_score?: number;
  malware_score?: number;
}

/**
 * Comprehensive ASN analysis result
 */
export interface ASNAnalysisResult {
  asn: number;
  info: RadarASNInfo;
  prefixes?: NetworkPrefix[];
  geography?: ASNGeography[];
  related_domains?: RelatedDomain[];
  metrics?: ASNMetrics;
  last_updated: string;
}

/**
 * Cloudflare Radar API response for ASN details (Public API)
 */
export interface CloudflareRadarASNResponse {
  success: boolean;
  result: {
    asn: {
      asn: number;
      name: string;
      aka?: string;
      orgName?: string;
      country?: string;
      countryName?: string;
      website?: string;
      source?: string;
    };
  };
}

/**
 * Cloudflare Radar API response for ASN prefixes
 */
export interface CloudflareRadarASNPrefixesResponse {
  success: boolean;
  result: {
    prefixes: Array<{
      prefix: string;
      ip_version: 4 | 6;
    }>;
  };
}
