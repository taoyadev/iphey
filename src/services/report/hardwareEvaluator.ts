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
 * Evaluate hardware fingerprint characteristics
 * Analyzes canvas, WebGL, audio, fonts, and screen properties
 */
export const evaluateHardware = (fingerprint: FingerprintPayload): EnhancedPanelResult => {
  let score = 100;
  const detailedSignals: DetailedSignal[] = [];
  const breakdown: Record<string, number> = {
    canvas: 30,
    webgl: 25,
    audio: 20,
    fonts: 15,
    screen: 10,
  };

  // Canvas Analysis
  if (fingerprint.canvas) {
    if (fingerprint.canvas.hash && fingerprint.canvas.hash.length > 10) {
      detailedSignals.push({
        message: 'Canvas fingerprint collected successfully',
        impact: 'info',
        scorePenalty: 0,
        explanation: `Canvas fingerprint hash: ${fingerprint.canvas.hash.substring(0, 8)}...`,
        recommendation: 'Normal canvas fingerprinting detected.',
      });
    } else {
      const penalty = 15;
      score -= penalty;
      breakdown.canvas -= penalty;
      detailedSignals.push({
        message: 'Canvas fingerprint incomplete or unusual',
        impact: 'medium',
        scorePenalty: penalty,
        explanation: 'Canvas fingerprinting may be blocked or returning inconsistent results.',
        recommendation: 'This may indicate privacy extensions or browser configuration issues.',
      });
    }
  } else {
    const penalty = 20;
    score -= penalty;
    breakdown.canvas -= penalty;
    detailedSignals.push({
      message: 'Canvas fingerprinting failed',
      impact: 'high',
      scorePenalty: penalty,
      explanation: 'Unable to generate canvas fingerprint, possibly blocked by privacy tools.',
      recommendation: 'Some sites may not function properly without canvas access.',
    });
  }

  // WebGL Analysis
  if (fingerprint.webgl) {
    const suspiciousPatterns = [
      /google/i.test(fingerprint.webgl.vendor) && !/chrome/i.test(fingerprint.userAgent),
      /microsoft/i.test(fingerprint.webgl.vendor) && !/edge|chrome/i.test(fingerprint.userAgent),
    ];

    if (suspiciousPatterns.some(Boolean)) {
      const penalty = 15;
      score -= penalty;
      breakdown.webgl -= penalty;
      detailedSignals.push({
        message: 'WebGL vendor/browser mismatch detected',
        impact: 'medium',
        scorePenalty: penalty,
        explanation: `WebGL vendor "${fingerprint.webgl.vendor}" may not match User-Agent string.`,
        recommendation: 'Ensure browser configuration consistency.',
      });
    } else {
      detailedSignals.push({
        message: 'WebGL fingerprint appears consistent',
        impact: 'info',
        scorePenalty: 0,
        explanation: `WebGL vendor: ${fingerprint.webgl.vendor}, Renderer: ${fingerprint.webgl.renderer?.substring(0, 30)}...`,
        recommendation: 'WebGL fingerprinting working normally.',
      });
    }
  } else {
    const penalty = 18;
    score -= penalty;
    breakdown.webgl -= penalty;
    detailedSignals.push({
      message: 'WebGL fingerprinting unavailable',
      impact: 'high',
      scorePenalty: penalty,
      explanation: 'WebGL context could not be created or is blocked.',
      recommendation: 'This may indicate privacy extensions or hardware limitations.',
    });
  }

  // Audio Context Analysis
  if (fingerprint.audio) {
    if (fingerprint.audio.hash && fingerprint.audio.hash.length > 5) {
      detailedSignals.push({
        message: 'Audio fingerprint generated successfully',
        impact: 'info',
        scorePenalty: 0,
        explanation: `Audio context fingerprint: ${fingerprint.audio.hash.substring(0, 6)}...`,
        recommendation: 'Audio fingerprinting working normally.',
      });
    } else {
      const penalty = 10;
      score -= penalty;
      breakdown.audio -= penalty;
      detailedSignals.push({
        message: 'Audio fingerprint incomplete',
        impact: 'medium',
        scorePenalty: penalty,
        explanation: 'Audio context fingerprinting may be partially blocked.',
        recommendation: 'This may affect some web applications that use audio.',
      });
    }
  } else {
    const penalty = 12;
    score -= penalty;
    breakdown.audio -= penalty;
    detailedSignals.push({
      message: 'Audio fingerprinting failed',
      impact: 'medium',
      scorePenalty: penalty,
      explanation: 'Audio Context API could not be accessed or is blocked.',
      recommendation: 'May indicate privacy extensions or browser security settings.',
    });
  }

  // Font Analysis
  if (fingerprint.enhancedFonts) {
    const fontCount = fingerprint.enhancedFonts.detected?.length || 0;

    if (fontCount === 0) {
      const penalty = 20;
      score -= penalty;
      breakdown.fonts -= penalty;
      detailedSignals.push({
        message: 'No fonts detected - unusual',
        impact: 'high',
        scorePenalty: penalty,
        explanation: 'Font enumeration returned no results, which is highly unusual.',
        recommendation: 'This strongly indicates font fingerprinting protection or configuration issues.',
      });
    } else if (fontCount < 20) {
      const penalty = 10;
      score -= penalty;
      breakdown.fonts -= penalty;
      detailedSignals.push({
        message: `Very few fonts detected (${fontCount})`,
        impact: 'medium',
        scorePenalty: penalty,
        explanation: 'Fewer fonts than typical for most systems.',
        recommendation: 'May indicate font fingerprinting protection or minimal system configuration.',
      });
    } else {
      detailedSignals.push({
        message: `Font fingerprint collected (${fontCount} fonts)`,
        impact: 'info',
        scorePenalty: 0,
        explanation: `Detected ${fontCount} system fonts, which is within normal range.`,
        recommendation: 'Font fingerprinting working normally.',
      });
    }
  } else if (fingerprint.fonts) {
    // Fallback to legacy fonts if enhanced fonts not available
    const fontCount = fingerprint.fonts.length;

    if (fontCount === 0) {
      const penalty = 15;
      score -= penalty;
      breakdown.fonts -= penalty;
      detailedSignals.push({
        message: 'No fonts detected',
        impact: 'medium',
        scorePenalty: penalty,
        explanation: 'Font enumeration returned no results.',
        recommendation: 'May indicate font fingerprinting protection.',
      });
    } else {
      detailedSignals.push({
        message: `Font fingerprint collected (${fontCount} fonts)`,
        impact: 'info',
        scorePenalty: 0,
        explanation: `Detected ${fontCount} system fonts.`,
        recommendation: 'Font fingerprinting working normally.',
      });
    }
  } else {
    const penalty = 15;
    score -= penalty;
    breakdown.fonts -= penalty;
    detailedSignals.push({
      message: 'Font fingerprinting failed',
      impact: 'medium',
      scorePenalty: penalty,
      explanation: 'Font enumeration could not be performed.',
      recommendation: 'May indicate privacy extensions or browser limitations.',
    });
  }

  const entropy = calculateEntropy([
    fingerprint.canvas?.hash || '',
    fingerprint.webgl?.hash || '',
    fingerprint.audio?.hash || '',
    ...(fingerprint.enhancedFonts?.detected || fingerprint.fonts || []),
  ]);

  const confidence = calculateConfidence(detailedSignals, 88);

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
