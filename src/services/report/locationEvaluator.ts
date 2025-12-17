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
 * Evaluate location-related fingerprint characteristics
 * Analyzes timezone, locale, and geolocation consistency
 */
export const evaluateLocation = (fingerprint: FingerprintPayload, timezone?: string): EnhancedPanelResult => {
  let score = 100;
  const detailedSignals: DetailedSignal[] = [];
  const breakdown: Record<string, number> = {
    timezone: 40,
    locale: 30,
    geolocation: 30,
  };

  // Timezone Analysis
  if (fingerprint.timezone) {
    if (timezone && fingerprint.timezone !== timezone) {
      const penalty = 45;
      score -= penalty;
      breakdown.timezone -= penalty;
      detailedSignals.push({
        message: 'System timezone does not match IP timezone',
        impact: 'high',
        scorePenalty: penalty,
        explanation: `Your system timezone is "${fingerprint.timezone}" but your IP suggests "${timezone}".`,
        recommendation: 'Align your system timezone with your IP location for better consistency.',
      });
    } else {
      detailedSignals.push({
        message: 'Timezone matches IP location',
        impact: 'info',
        scorePenalty: 0,
        explanation: 'Your system timezone is consistent with your IP location.',
        recommendation: 'Good consistency detected.',
      });
    }
  } else {
    const penalty = 15;
    score -= penalty;
    breakdown.timezone -= penalty;
    detailedSignals.push({
      message: 'Missing timezone data',
      impact: 'medium',
      scorePenalty: penalty,
      explanation: 'Unable to detect your system timezone.',
      recommendation: 'Ensure timezone access is not blocked by privacy settings.',
    });
  }

  // Locale Analysis
  if (fingerprint.languages && fingerprint.languages.length > 0) {
    const primaryLanguage = fingerprint.languages[0];
    const timezoneRegion = fingerprint.timezone?.split('/')[0];

    // Check for common mismatches
    if (timezoneRegion) {
      const isLanguageMismatch =
        (timezoneRegion === 'America' && !primaryLanguage.match(/en|es|fr|pt/)) ||
        (timezoneRegion === 'Europe' && !primaryLanguage.match(/en|de|fr|it|es|nl|pl/)) ||
        (timezoneRegion === 'Asia' && !primaryLanguage.match(/en|zh|ja|ko|hi|ar|th|vi/));

      if (isLanguageMismatch) {
        const penalty = 20;
        score -= penalty;
        breakdown.locale -= penalty;
        detailedSignals.push({
          message: 'Primary language may not match timezone region',
          impact: 'medium',
          scorePenalty: penalty,
          explanation: `Primary language "${primaryLanguage}" may be unusual for timezone region "${timezoneRegion}".`,
          recommendation: 'Consider using a language more common in your timezone region.',
        });
      }
    }
  }

  // Geolocation Analysis (if available)
  if (fingerprint.geolocation) {
    const { accuracy } = fingerprint.geolocation;

    if (accuracy > 10000) {
      // More than 10km accuracy
      const penalty = 10;
      score -= penalty;
      breakdown.geolocation -= penalty;
      detailedSignals.push({
        message: 'Low geolocation accuracy',
        impact: 'low',
        scorePenalty: penalty,
        explanation: `Geolocation accuracy is ${(accuracy / 1000).toFixed(1)}km, which is quite low.`,
        recommendation: 'This is normal for IP-based geolocation.',
      });
    } else {
      detailedSignals.push({
        message: 'Good geolocation accuracy',
        impact: 'info',
        scorePenalty: 0,
        explanation: `Geolocation accuracy is ${(accuracy / 1000).toFixed(1)}km.`,
        recommendation: 'Accurate location detection available.',
      });
    }
  } else {
    const penalty = 5;
    score -= penalty;
    breakdown.geolocation -= penalty;
    detailedSignals.push({
      message: 'Geolocation access denied or unavailable',
      impact: 'low',
      scorePenalty: penalty,
      explanation: 'Unable to access precise geolocation data.',
      recommendation: 'This is normal if location services are disabled.',
    });
  }

  const entropy = calculateEntropy([
    fingerprint.timezone || '',
    ...(fingerprint.languages || []),
    fingerprint.geolocation ? `${fingerprint.geolocation.latitude},${fingerprint.geolocation.longitude}` : '',
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
