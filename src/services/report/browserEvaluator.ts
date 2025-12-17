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
 * Evaluate browser fingerprint characteristics
 * Analyzes User-Agent, languages, platform, hardware, and permissions
 */
export const evaluateBrowser = (fingerprint: FingerprintPayload): EnhancedPanelResult => {
  let score = 100;
  const detailedSignals: DetailedSignal[] = [];
  const breakdown: Record<string, number> = {
    userAgent: 25,
    languages: 15,
    platform: 20,
    hardware: 20,
    permissions: 20,
  };

  // User-Agent Analysis
  const ua = fingerprint.userAgent || '';

  // Check for automation tools
  if (/Headless|bot|spider|crawler|phantomjs|selenium/i.test(ua)) {
    const penalty = 40;
    score -= penalty;
    breakdown.userAgent -= penalty;
    detailedSignals.push({
      message: 'User-Agent indicates automation/headless context',
      impact: 'critical',
      scorePenalty: penalty,
      explanation:
        'Your User-Agent string contains patterns commonly associated with automated browsers, bots, or headless environments.',
      recommendation: 'Use a standard browser configuration with typical User-Agent headers.',
    });
  }

  // Check for outdated browser versions
  const chromeMatch = ua.match(/Chrome\/(\d+\.\d+)/);
  if (chromeMatch) {
    const version = parseFloat(chromeMatch[1]);
    if (version < 90) {
      const penalty = 15;
      score -= penalty;
      breakdown.userAgent -= penalty;
      detailedSignals.push({
        message: 'Outdated Chrome version detected',
        impact: 'medium',
        scorePenalty: penalty,
        explanation: `Chrome ${version} is significantly outdated. Most users run recent versions.`,
        recommendation: 'Update to the latest Chrome version for better compatibility and security.',
      });
    }
  }

  // Language Analysis
  if (fingerprint.languages) {
    if (fingerprint.languages.length > 5) {
      const penalty = 12;
      score -= penalty;
      breakdown.languages -= penalty;
      detailedSignals.push({
        message: 'Unusual number of preferred languages',
        impact: 'medium',
        scorePenalty: penalty,
        explanation: `Most users have 1-3 preferred languages. You have ${fingerprint.languages.length}.`,
        recommendation: 'Configure your browser with 1-3 primary languages that match your location.',
      });
    }

    // Check for language/location mismatch
    const hasEnglish = fingerprint.languages.some(lang => lang.startsWith('en'));
    const hasChinese = fingerprint.languages.some(lang => lang.startsWith('zh'));
    if (hasEnglish && hasChinese) {
      const penalty = 8;
      score -= penalty;
      breakdown.languages -= penalty;
      detailedSignals.push({
        message: 'Mixed language preferences may seem inconsistent',
        impact: 'low',
        scorePenalty: penalty,
        explanation: 'Having both English and Chinese as preferred languages is less common.',
        recommendation: 'Consider using languages that align with your target region.',
      });
    }
  }

  // Platform Analysis
  if (fingerprint.platform && ua) {
    const platformMismatch =
      (/Linux/.test(fingerprint.platform) && /Windows|Mac/.test(ua)) ||
      (/Windows/.test(fingerprint.platform) && /Linux|Mac/.test(ua)) ||
      (/Mac/.test(fingerprint.platform) && /Windows|Linux/.test(ua));

    if (platformMismatch) {
      const penalty = 25;
      score -= penalty;
      breakdown.platform -= penalty;
      detailedSignals.push({
        message: 'Platform mismatch between navigator.platform and User-Agent',
        impact: 'high',
        scorePenalty: penalty,
        explanation: `Platform reported as "${fingerprint.platform}" but User-Agent suggests a different OS.`,
        recommendation: 'Ensure your browser configuration reports consistent platform information.',
      });
    }
  }

  // Hardware Analysis
  if (fingerprint.hardwareConcurrency) {
    if (fingerprint.hardwareConcurrency > 128) {
      const penalty = 15;
      score -= penalty;
      breakdown.hardware -= penalty;
      detailedSignals.push({
        message: 'Unusually high CPU core count reported',
        impact: 'medium',
        scorePenalty: penalty,
        explanation: `${fingerprint.hardwareConcurrency} CPU cores exceeds typical consumer hardware.`,
        recommendation: 'This may indicate virtualization or unusual hardware configuration.',
      });
    } else if (fingerprint.hardwareConcurrency < 2) {
      const penalty = 10;
      score -= penalty;
      breakdown.hardware -= penalty;
      detailedSignals.push({
        message: 'Very low CPU core count reported',
        impact: 'low',
        scorePenalty: penalty,
        explanation: `${fingerprint.hardwareConcurrency} CPU cores is unusual for modern devices.`,
        recommendation: 'This may indicate resource constraints or configuration issues.',
      });
    }
  }

  // Screen Resolution Analysis
  if (fingerprint.screen) {
    const { width, height, pixelRatio } = fingerprint.screen;
    const totalPixels = width * height;

    // Check for unusual resolutions
    if (totalPixels < 800 * 600) {
      const penalty = 8;
      score -= penalty;
      breakdown.hardware -= penalty;
      detailedSignals.push({
        message: 'Unusually low screen resolution',
        impact: 'low',
        scorePenalty: penalty,
        explanation: `${width}x${height} is below typical modern screen resolutions.`,
        recommendation: 'Use a standard screen resolution for your device type.',
      });
    }

    // Check for unusual pixel ratios
    if (pixelRatio && (pixelRatio < 1 || pixelRatio > 4)) {
      const penalty = 5;
      score -= penalty;
      breakdown.hardware -= penalty;
      detailedSignals.push({
        message: 'Unusual device pixel ratio',
        impact: 'low',
        scorePenalty: penalty,
        explanation: `Pixel ratio of ${pixelRatio} is uncommon for typical devices.`,
        recommendation: 'Standard pixel ratios are 1, 1.25, 1.5, 2, 2.5, 3, or 4.',
      });
    }
  }

  // Permission API Analysis
  if (fingerprint.permissions) {
    const deniedPermissions = fingerprint.permissions.filter(p => p.state === 'denied').length;
    const totalPermissions = fingerprint.permissions.length;

    if (deniedPermissions / totalPermissions > 0.7) {
      const penalty = 10;
      score -= penalty;
      breakdown.permissions -= penalty;
      detailedSignals.push({
        message: 'High number of denied browser permissions',
        impact: 'low',
        scorePenalty: penalty,
        explanation: `${deniedPermissions} of ${totalPermissions} permissions are denied, which may indicate privacy-focused configuration.`,
        recommendation: 'Consider allowing essential permissions for better functionality.',
      });
    }
  }

  const entropy = calculateEntropy([
    ua,
    ...(fingerprint.languages || []),
    fingerprint.platform || '',
    String(fingerprint.hardwareConcurrency || ''),
    `${fingerprint.screen?.width || 0}x${fingerprint.screen?.height || 0}`,
  ]);

  const confidence = calculateConfidence(detailedSignals, 90);

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
