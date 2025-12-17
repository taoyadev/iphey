/**
 * Enhanced IP Detection Service
 * Comprehensive IP analysis integrating multiple intelligence sources:
 * - Geolocation (IPInfo.io, Cloudflare Radar)
 * - Threat Intelligence (AbuseIPDB, Spamhaus)
 * - ASN Analysis (Cloudflare Radar)
 */

import { logger } from '../utils/logger';
import { lookupIpInsight } from './ipService';
import { ThreatIntelligenceService } from './threatIntelligence';
import { ASNService, extractASN } from './asnService';
import type { NormalizedIpInsight } from '../types/ip';
import type { ThreatIntelligenceResponse } from '../types/threat';
import type { ASNAnalysisResult } from '../types/asn';

/**
 * Enhanced IP detection result combining all intelligence sources
 */
export interface EnhancedIpDetectionResult {
  // Basic IP information
  ip: string;

  // Geolocation and network info
  geolocation: NormalizedIpInsight;

  // Threat intelligence (optional - only if enabled)
  threats?: ThreatIntelligenceResponse;

  // ASN analysis (optional - only if ASN available)
  asn_analysis?: ASNAnalysisResult;

  // Combined risk assessment
  risk_assessment: {
    overall_score: number;
    overall_level: 'low' | 'medium' | 'high' | 'critical';
    factors: string[];
    recommendation: string;
  };

  // Metadata
  sources_used: string[];
  analysis_timestamp: string;
}

/**
 * Enhanced IP Service
 * Coordinates multiple intelligence sources for comprehensive IP analysis
 */
export class EnhancedIpService {
  private readonly threatService: ThreatIntelligenceService;
  private readonly asnService: ASNService;

  constructor() {
    this.threatService = new ThreatIntelligenceService();
    this.asnService = new ASNService();
  }

  /**
   * Perform comprehensive IP detection and analysis
   *
   * @param ip - IP address to analyze
   * @param options - Analysis options
   * @returns Complete IP intelligence report
   */
  async detectIP(
    ip: string,
    options: {
      includeThreat?: boolean;
      includeASN?: boolean;
    } = {}
  ): Promise<EnhancedIpDetectionResult> {
    const startTime = Date.now();
    logger.info({ ip, options }, 'Starting enhanced IP detection');

    try {
      // Always fetch basic geolocation (fastest, always available)
      const geolocation = await lookupIpInsight(ip);

      // Prepare promises for parallel execution
      const sourcesUsed: string[] = [geolocation.source];

      // Extract ASN from geolocation data
      const asnNumber = extractASN(geolocation.asn);

      const threatPromise: Promise<ThreatIntelligenceResponse | null> =
        options.includeThreat !== false
          ? this.threatService.analyzeIP(ip).catch(error => {
              logger.warn({ ip, error }, 'Threat intelligence analysis failed');
              return null;
            })
          : Promise.resolve(null);

      const asnPromise: Promise<ASNAnalysisResult | null> =
        options.includeASN !== false && asnNumber
          ? this.asnService.analyzeASN(asnNumber).catch(error => {
              logger.warn({ ip, asn: asnNumber, error }, 'ASN analysis failed');
              return null;
            })
          : Promise.resolve(null);

      // Execute all analyses in parallel
      const [threats, asnAnalysis] = await Promise.all([threatPromise, asnPromise]);

      // Track which sources provided data
      if (threats) {
        sourcesUsed.push(...threats.combined.sources);
      }
      if (asnAnalysis) {
        sourcesUsed.push('Cloudflare Radar ASN');
      }

      // Calculate combined risk assessment
      const riskAssessment = this.calculateRiskAssessment(geolocation, threats, asnAnalysis);

      const duration = Date.now() - startTime;
      logger.info(
        {
          ip,
          duration,
          sourcesUsed: sourcesUsed.length,
          riskLevel: riskAssessment.overall_level,
        },
        'Enhanced IP detection completed'
      );

      return {
        ip,
        geolocation,
        threats: threats ?? undefined,
        asn_analysis: asnAnalysis ?? undefined,
        risk_assessment: riskAssessment,
        sources_used: [...new Set(sourcesUsed)], // Remove duplicates
        analysis_timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error({ ip, error }, 'Enhanced IP detection failed');
      throw error;
    }
  }

  /**
   * Calculate combined risk assessment from all available intelligence
   *
   * @param geolocation - Basic IP geolocation data
   * @param threats - Threat intelligence data (optional)
   * @param asnAnalysis - ASN analysis data (optional)
   * @returns Comprehensive risk assessment
   */
  private calculateRiskAssessment(
    geolocation: NormalizedIpInsight,
    threats?: ThreatIntelligenceResponse | null,
    asnAnalysis?: ASNAnalysisResult | null
  ): EnhancedIpDetectionResult['risk_assessment'] {
    let score = 0;
    const factors: string[] = [];

    // Base score from geolocation privacy indicators
    if (geolocation.privacy?.vpn) {
      score += 20;
      factors.push('VPN detected');
    }
    if (geolocation.privacy?.proxy) {
      score += 25;
      factors.push('Proxy detected');
    }
    if (geolocation.privacy?.tor) {
      score += 40;
      factors.push('Tor exit node detected');
    }
    if (geolocation.privacy?.hosting) {
      score += 15;
      factors.push('Hosting/datacenter IP');
    }

    // Add threat intelligence score
    if (threats?.combined) {
      score += threats.combined.threat_score * 0.6; // Weight: 60%
      if (threats.combined.is_malicious) {
        factors.push(`Malicious activity detected (${threats.combined.threat_types.join(', ')})`);
      }
    }

    // Add risk from geolocation service
    if (geolocation.riskScore) {
      score += geolocation.riskScore * 0.2; // Weight: 20%
      if (geolocation.riskReasons?.length) {
        factors.push(...geolocation.riskReasons);
      }
    }

    // ASN-based risk factors
    if (asnAnalysis?.info) {
      // Check for known high-risk ASN characteristics
      const asnName = asnAnalysis.info.name?.toLowerCase() || '';
      if (asnName.includes('hosting') || asnName.includes('cloud')) {
        score += 10;
        factors.push('Cloud/hosting ASN');
      }
      if (asnName.includes('vpn') || asnName.includes('proxy')) {
        score += 20;
        factors.push('VPN/Proxy ASN');
      }
    }

    // Cap score at 100
    score = Math.min(100, Math.round(score));

    // Determine risk level
    let level: 'low' | 'medium' | 'high' | 'critical';
    if (score >= 70) level = 'critical';
    else if (score >= 50) level = 'high';
    else if (score >= 30) level = 'medium';
    else level = 'low';

    // Generate recommendation
    let recommendation: string;
    if (level === 'critical') {
      recommendation = 'Block or require additional verification. High risk of malicious activity.';
    } else if (level === 'high') {
      recommendation = 'Proceed with caution. Implement additional security checks.';
    } else if (level === 'medium') {
      recommendation = 'Monitor activity. Consider rate limiting or CAPTCHA.';
    } else {
      recommendation = 'Low risk. Normal processing recommended.';
    }

    return {
      overall_score: score,
      overall_level: level,
      factors: factors.length > 0 ? factors : ['No significant risk factors detected'],
      recommendation,
    };
  }

  /**
   * Get service status for all components
   *
   * @returns Status of all intelligence services
   */
  async getServiceStatus(): Promise<{
    geolocation: boolean;
    threat_intelligence: boolean;
    asn_analysis: boolean;
  }> {
    const [threatStatus, asnStatus] = await Promise.all([
      this.threatService.getProviderStatus().catch(() => null),
      this.asnService.getStatus().catch(() => null),
    ]);

    return {
      geolocation: true, // Always available
      threat_intelligence: threatStatus ? threatStatus.available_sources > 0 : false,
      asn_analysis: asnStatus?.available || false,
    };
  }
}
