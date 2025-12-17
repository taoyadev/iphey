import type { FingerprintPayload } from '../../types/report';
import {
  type DetailedSignal,
  type EnhancedPanelResult,
  statusFromScore,
  clampScore,
  calculateEntropy,
  calculateConfidence,
} from './scoring';

/**
 * Evaluate software fingerprint characteristics
 * Analyzes cookies, plugins, WebRTC, and DOM storage availability
 */
export const evaluateSoftware = (fingerprint: FingerprintPayload): EnhancedPanelResult => {
  let score = 100;
  const detailedSignals: DetailedSignal[] = [];
  const breakdown: Record<string, number> = {
    cookies: 25,
    plugins: 20,
    webrtc: 25,
    dom: 30,
  };

  // Cookie Analysis
  if (fingerprint.cookiesEnabled === false) {
    const penalty = 20;
    score -= penalty;
    breakdown.cookies -= penalty;
    detailedSignals.push({
      message: 'Cookies are disabled',
      impact: 'medium',
      scorePenalty: penalty,
      explanation: 'Cookies are completely disabled, which is uncommon for most browsing scenarios.',
      recommendation: 'Consider enabling cookies for better website compatibility.',
    });
  } else {
    detailedSignals.push({
      message: 'Cookies are enabled',
      impact: 'info',
      scorePenalty: 0,
      explanation: 'Cookie functionality is available and working normally.',
      recommendation: 'Standard configuration detected.',
    });
  }

  // Legacy Plugin Analysis
  const hasLegacyPlugins = fingerprint.flashEnabled || fingerprint.javaEnabled;
  if (hasLegacyPlugins) {
    const penalty = 12;
    score -= penalty;
    breakdown.plugins -= penalty;
    detailedSignals.push({
      message: 'Legacy plugins detected (Flash/Java)',
      impact: 'medium',
      scorePenalty: penalty,
      explanation: 'Legacy plugins like Flash or Java are outdated and security risks.',
      recommendation: 'Remove or disable legacy plugins for better security.',
    });
  }

  // WebRTC Analysis
  if (fingerprint.webrtcDisabled) {
    const penalty = 15;
    score -= penalty;
    breakdown.webrtc -= penalty;
    detailedSignals.push({
      message: 'WebRTC appears to be disabled',
      impact: 'medium',
      scorePenalty: penalty,
      explanation: 'WebRTC functionality is not available, possibly due to privacy extensions.',
      recommendation: 'WebRTC is required for many real-time communication features.',
    });
  } else {
    detailedSignals.push({
      message: 'WebRTC functionality available',
      impact: 'info',
      scorePenalty: 0,
      explanation: 'WebRTC APIs are accessible and working normally.',
      recommendation: 'Standard WebRTC configuration detected.',
    });
  }

  // DOM Storage Analysis
  if (fingerprint.domStorageEnabled === false) {
    const penalty = 18;
    score -= penalty;
    breakdown.dom -= penalty;
    detailedSignals.push({
      message: 'DOM storage (localStorage/sessionStorage) disabled',
      impact: 'high',
      scorePenalty: penalty,
      explanation: 'DOM storage is not available, which will break many modern web applications.',
      recommendation: 'Enable DOM storage for proper website functionality.',
    });
  }

  const entropy = calculateEntropy([
    fingerprint.cookiesEnabled ? 'cookies-enabled' : 'cookies-disabled',
    fingerprint.webrtcDisabled ? 'webrtc-disabled' : 'webrtc-enabled',
    fingerprint.domStorageEnabled ? 'dom-enabled' : 'dom-disabled',
  ]);

  const confidence = calculateConfidence(detailedSignals, 85);

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
