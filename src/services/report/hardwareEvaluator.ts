import type { FingerprintPayload } from '../../types/report';
import type { DetailedSignal, EnhancedPanelResult } from './scoring';

/** Legacy compatibility panel: missing/blocked hardware is not evidence of risk. */
export const evaluateHardware = (fingerprint: FingerprintPayload): EnhancedPanelResult => {
  const observations = [
    ['Canvas', Boolean(fingerprint.canvas?.hash ?? fingerprint.canvasFingerprint)],
    ['WebGL', Boolean(fingerprint.webgl?.renderer ?? fingerprint.webglRenderer)],
    ['Audio', Boolean(fingerprint.audio?.hash ?? fingerprint.audioFingerprint)],
    ['Document fonts', Boolean(fingerprint.enhancedFonts || fingerprint.fonts)],
  ] as const;
  const detailedSignals: DetailedSignal[] = observations.map(([name, present]) => ({
    message: `${name}: ${present ? 'observation supplied' : 'not observed'}`,
    impact: 'info',
    scorePenalty: 0,
    explanation: present
      ? 'A browser measurement was supplied. It does not establish population uniqueness or identity.'
      : 'The API may be blocked, unsupported or not run. Missing data is not evidence of an unsafe identity.',
    recommendation: 'Use the observation workspace to inspect probe status and compare the same scope.',
  }));
  return {
    status: 'trustworthy',
    score: 100,
    signals: detailedSignals.map(s => s.message),
    detailedSignals,
    // Deprecated legacy statistics, omitted from public report enhancement data.
    confidence: 0,
    entropy: 0,
    breakdown: {},
  };
};
