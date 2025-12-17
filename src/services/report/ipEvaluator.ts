import type { IpInfoPrivacy } from '../../types/ip';
import {
  type DetailedSignal,
  type EnhancedPanelResult,
  statusFromScore,
  clampScore,
  calculateEntropy,
  calculateConfidence,
} from './scoring';

/**
 * Evaluate IP address reputation and characteristics
 * Analyzes risk score, privacy/anonymity tools, network type, and ASN
 */
export const evaluateIp = (
  riskScore?: number,
  privacy?: IpInfoPrivacy,
  networkType?: string,
  org?: string,
  asn?: string
): EnhancedPanelResult => {
  let score = 100 - (riskScore ?? 5);
  const detailedSignals: DetailedSignal[] = [];
  const breakdown: Record<string, number> = {
    reputation: 40,
    privacy: 35,
    network: 25,
  };

  // Risk Score Analysis
  if (riskScore && riskScore > 10) {
    const penalty = Math.min(riskScore, 30);
    score -= penalty;
    breakdown.reputation -= penalty;
    detailedSignals.push({
      message: `IP has elevated risk score (${riskScore})`,
      impact: riskScore > 50 ? 'high' : 'medium',
      scorePenalty: penalty,
      explanation:
        'This IP address has been associated with suspicious activity or has a higher-than-normal risk profile.',
      recommendation: 'Consider using a different IP address for sensitive operations.',
    });
  }

  // Privacy/Anonymity Analysis
  if (privacy) {
    if (privacy.vpn) {
      const penalty = 25;
      score -= penalty;
      breakdown.privacy -= penalty;
      detailedSignals.push({
        message: 'IP address belongs to VPN service',
        impact: 'medium',
        scorePenalty: penalty,
        explanation: 'This IP address is associated with a VPN provider, which may be flagged by some services.',
        recommendation: 'VPN usage is legitimate but may attract additional scrutiny.',
      });
    }
    if (privacy.proxy) {
      const penalty = 30;
      score -= penalty;
      breakdown.privacy -= penalty;
      detailedSignals.push({
        message: 'IP address detected as proxy',
        impact: 'high',
        scorePenalty: penalty,
        explanation: 'This IP address is associated with proxy services, commonly used for anonymity.',
        recommendation: 'Proxy usage may be detected and blocked by some services.',
      });
    }
    if (privacy.tor) {
      const penalty = 35;
      score -= penalty;
      breakdown.privacy -= penalty;
      detailedSignals.push({
        message: 'IP address is Tor exit node',
        impact: 'high',
        scorePenalty: penalty,
        explanation: 'This IP address is a known Tor exit node, providing strong anonymity but often blocked.',
        recommendation: 'Tor provides strong privacy but is widely recognized and may be blocked.',
      });
    }
  }

  // Network Type Analysis
  if (networkType) {
    if (/hosting|datacenter|cloud/i.test(networkType)) {
      const penalty = 35;
      score -= penalty;
      breakdown.network -= penalty;
      detailedSignals.push({
        message: `IP from hosting provider: ${networkType}`,
        impact: 'high',
        scorePenalty: penalty,
        explanation: 'This IP address originates from a datacenter or cloud provider rather than residential ISP.',
        recommendation: 'Residential IP addresses typically have better reputation than hosting IPs.',
      });
    } else if (/mobile|cellular/i.test(networkType)) {
      detailedSignals.push({
        message: `Mobile network detected: ${networkType}`,
        impact: 'info',
        scorePenalty: 0,
        explanation: 'This IP address originates from a mobile network provider.',
        recommendation: 'Mobile IPs are common and generally have good reputation.',
      });
    } else if (/isp|broadband/i.test(networkType)) {
      detailedSignals.push({
        message: `ISP connection detected: ${networkType}`,
        impact: 'info',
        scorePenalty: 0,
        explanation: 'This IP address originates from a residential ISP.',
        recommendation: 'Residential ISP connections typically have the best reputation.',
      });
    }
  }

  // Organization Analysis
  if (org) {
    if (/vpn|proxy|hosting|cloud|server/i.test(org)) {
      const penalty = 15;
      score -= penalty;
      breakdown.network -= penalty;
      detailedSignals.push({
        message: `Organization suggests hosting/VPN: ${org}`,
        impact: 'medium',
        scorePenalty: penalty,
        explanation: `The IP owner "${org}" appears to be a hosting or VPN provider.`,
        recommendation: 'Verify this matches your expected IP provider.',
      });
    }
  }

  // ASN Analysis
  if (asn) {
    const asnNumber = parseInt(asn.replace(/\D/g, ''));
    if (asnNumber > 200000) {
      detailedSignals.push({
        message: `High ASN number: ${asn}`,
        impact: 'low',
        scorePenalty: 0,
        explanation: `Autonomous System Number ${asn} is relatively new, which may indicate specific types of providers.`,
        recommendation: 'This is typically not concerning.',
      });
    }
  }

  // Positive Signal - Clean IP
  if (detailedSignals.filter(s => s.impact !== 'info').length === 0) {
    detailedSignals.push({
      message: 'IP address shows clean reputation',
      impact: 'info',
      scorePenalty: 0,
      explanation: 'No significant risk factors detected for this IP address.',
      recommendation: 'This IP address appears suitable for most use cases.',
    });
  }

  const entropy = calculateEntropy([org || '', asn || '', networkType || '', privacy ? 'privacy' : 'standard']);
  const confidence = calculateConfidence(detailedSignals, 95);

  return {
    status: statusFromScore(score),
    score: clampScore(score),
    signals: detailedSignals.map(s => s.message),
    detailedSignals,
    confidence,
    entropy,
    breakdown,
  };
};
