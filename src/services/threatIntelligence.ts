/**
 * Threat Intelligence Service
 * Aggregates threat intelligence from multiple sources and provides combined analysis
 */

import { AbuseIPDBClient } from '../clients/abuseipdbClient';
import { SpamhausClient } from '../clients/spamhausClient';
import type { ThreatIntelResult, CombinedThreatResult, ThreatIntelligenceResponse } from '../types/threat';
import { logger } from '../utils/logger';
import { config } from '../config';

export class ThreatIntelligenceService {
  private readonly abuseipdbClient: AbuseIPDBClient;
  private readonly spamhausClient: SpamhausClient;

  constructor() {
    this.abuseipdbClient = new AbuseIPDBClient(config.ABUSEIPDB_API_KEY);
    this.spamhausClient = new SpamhausClient();
  }

  /**
   * Analyze IP address for threats using multiple intelligence sources
   *
   * @param ip - IP address to analyze
   * @returns Complete threat intelligence response
   */
  async analyzeIP(ip: string): Promise<ThreatIntelligenceResponse> {
    const startTime = Date.now();
    logger.info({ ip }, 'Starting threat intelligence analysis');

    // Query both providers in parallel for performance
    const [abuseipdbResult, spamhausResult] = await Promise.all([
      this.abuseipdbClient.checkIP(ip),
      this.spamhausClient.checkIP(ip),
    ]);

    // Combine results
    const combined = this.combineResults(abuseipdbResult, spamhausResult);

    const duration = Date.now() - startTime;
    logger.info(
      {
        ip,
        duration,
        threat_score: combined.threat_score,
        threat_level: combined.threat_level,
        is_malicious: combined.is_malicious,
      },
      'Threat intelligence analysis completed'
    );

    return {
      providers: {
        abuseipdb: abuseipdbResult,
        spamhaus: spamhausResult,
      },
      combined,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Combine results from multiple threat intelligence providers
   *
   * @param abuseipdb - AbuseIPDB result
   * @param spamhaus - Spamhaus result
   * @returns Combined threat analysis
   */
  private combineResults(abuseipdb: ThreatIntelResult, spamhaus: ThreatIntelResult): CombinedThreatResult {
    // Determine if IP is malicious
    const isMalicious = abuseipdb.is_listed || spamhaus.is_listed;

    // Collect unique threat types
    const threatTypes = new Set<string>();
    if (abuseipdb.threat_types) {
      abuseipdb.threat_types.forEach(type => threatTypes.add(type));
    }
    if (spamhaus.threat_types) {
      spamhaus.threat_types.forEach(type => threatTypes.add(type));
    }

    // Calculate combined threat score (0-100)
    const threatScore = this.calculateThreatScore(abuseipdb, spamhaus);

    // Determine threat level based on score
    const threatLevel = this.getThreatLevel(threatScore);

    // Calculate combined confidence
    const confidence = this.calculateConfidence(abuseipdb, spamhaus);

    // Collect successful sources
    const sources: string[] = [];
    if (!abuseipdb.error) sources.push('AbuseIPDB');
    if (!spamhaus.error) sources.push('Spamhaus');

    return {
      is_malicious: isMalicious,
      threat_score: threatScore,
      threat_level: threatLevel,
      threat_types: Array.from(threatTypes),
      sources,
      confidence,
    };
  }

  /**
   * Calculate combined threat score from multiple sources
   *
   * Scoring algorithm:
   * - AbuseIPDB contributes up to 60 points (based on abuse confidence score)
   * - Spamhaus contributes up to 40 points (if listed)
   * - Clean IPs get a baseline score of 5
   *
   * @param abuseipdb - AbuseIPDB result
   * @param spamhaus - Spamhaus result
   * @returns Threat score (0-100)
   */
  private calculateThreatScore(abuseipdb: ThreatIntelResult, spamhaus: ThreatIntelResult): number {
    let score = 0;

    // AbuseIPDB contribution (max 60 points)
    if (abuseipdb.is_listed && !abuseipdb.error) {
      const abuseScore = abuseipdb.abuse_confidence_score || 50;
      score += Math.min(60, abuseScore * 0.6);
    }

    // Spamhaus contribution (max 40 points)
    if (spamhaus.is_listed && !spamhaus.error) {
      score += 40;
    }

    // Base score for clean IPs (indicates low risk)
    if (!abuseipdb.is_listed && !spamhaus.is_listed) {
      score = 5;
    }

    return Math.round(Math.min(100, score));
  }

  /**
   * Determine threat level based on threat score
   *
   * - Low: 0-19 (clean or minimal risk)
   * - Medium: 20-39 (some suspicious activity)
   * - High: 40-69 (significant threat indicators)
   * - Critical: 70-100 (highly malicious)
   *
   * @param score - Threat score (0-100)
   * @returns Threat level
   */
  private getThreatLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 70) return 'critical';
    if (score >= 40) return 'high';
    if (score >= 20) return 'medium';
    return 'low';
  }

  /**
   * Calculate combined confidence from multiple sources
   *
   * @param abuseipdb - AbuseIPDB result
   * @param spamhaus - Spamhaus result
   * @returns Combined confidence (0-1)
   */
  private calculateConfidence(abuseipdb: ThreatIntelResult, spamhaus: ThreatIntelResult): number {
    const confidences: number[] = [];

    if (!abuseipdb.error && abuseipdb.confidence > 0) {
      confidences.push(abuseipdb.confidence);
    }
    if (!spamhaus.error && spamhaus.confidence > 0) {
      confidences.push(spamhaus.confidence);
    }

    if (confidences.length === 0) {
      return 0.5; // Default medium confidence if no data
    }

    // Calculate weighted average confidence
    const avgConfidence = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
    return Math.round(avgConfidence * 100) / 100;
  }

  /**
   * Get status of all threat intelligence providers
   *
   * @returns Provider availability status
   */
  async getProviderStatus(): Promise<{
    abuseipdb: { configured: boolean; available: boolean };
    spamhaus: { configured: boolean; available: boolean };
    available_sources: number;
    total_sources: number;
  }> {
    const [abuseipdbAvailable, spamhausAvailable] = await Promise.all([
      this.abuseipdbClient.isAvailable(),
      this.spamhausClient.isAvailable(),
    ]);

    const abuseipdbConfigured = this.abuseipdbClient.isConfigured();

    return {
      abuseipdb: {
        configured: abuseipdbConfigured,
        available: abuseipdbAvailable,
      },
      spamhaus: {
        configured: true, // Spamhaus doesn't need configuration
        available: spamhausAvailable,
      },
      available_sources: [abuseipdbAvailable, spamhausAvailable].filter(Boolean).length,
      total_sources: 2,
    };
  }

  /**
   * Get rate limits for all providers
   *
   * @returns Rate limit information
   */
  getRateLimits(): {
    abuseipdb: { requests_per_day: number; requests_per_hour: number };
    spamhaus: { requests_per_day: number; requests_per_hour: number };
  } {
    return {
      abuseipdb: this.abuseipdbClient.getRateLimit(),
      spamhaus: this.spamhausClient.getRateLimit(),
    };
  }
}
