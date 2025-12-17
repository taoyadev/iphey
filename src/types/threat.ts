/**
 * Threat Intelligence Types
 * Type definitions for threat intelligence data and providers
 */

/**
 * Individual threat intelligence check result
 */
export interface ThreatIntelResult {
  /** Source of the threat intelligence */
  source: string;
  /** Whether the IP is listed in this source */
  is_listed: boolean;
  /** Array of detected threat types */
  threat_types: string[];
  /** Confidence score (0-1) */
  confidence: number;
  /** Last check timestamp */
  last_checked?: string;
  /** Number of reports (if applicable) */
  reports?: number;
  /** Abuse confidence score (if applicable) */
  abuse_confidence_score?: number;
  /** Blacklist type */
  list_type?: string;
  /** Error message if check failed */
  error?: string;
}

/**
 * Combined threat intelligence result
 */
export interface CombinedThreatResult {
  /** Whether the IP is considered malicious */
  is_malicious: boolean;
  /** Threat score (0-100) */
  threat_score: number;
  /** Combined threat level */
  threat_level: 'low' | 'medium' | 'high' | 'critical';
  /** Array of detected threat types */
  threat_types: string[];
  /** Sources that successfully checked */
  sources: string[];
  /** Combined confidence (0-1) */
  confidence: number;
}

/**
 * Full threat intelligence response
 */
export interface ThreatIntelligenceResponse {
  /** Individual provider results */
  providers: {
    abuseipdb: ThreatIntelResult;
    spamhaus: ThreatIntelResult;
  };
  /** Combined analysis */
  combined: CombinedThreatResult;
  /** Timestamp of the analysis */
  timestamp: string;
}

/**
 * AbuseIPDB API response structure
 */
export interface AbuseIPDBResponse {
  data?: {
    ipAddress: string;
    abuseConfidenceScore?: number;
    totalReports?: number;
    isWhitelisted?: boolean;
    usageType?: string;
    isp?: string;
    domain?: string;
    countryCode?: string;
    lastReportedAt?: string;
  };
}

/**
 * Spamhaus DNS response structure
 */
export interface SpamhausDNSResponse {
  Status?: number;
  Answer?: Array<{
    name?: string;
    type?: number;
    TTL?: number;
    data?: string;
  }>;
}
