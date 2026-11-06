import { describe, expect, it } from 'vitest';
import { buildUniquenessSummary } from '../report/uniqueness';

describe('buildUniquenessSummary', () => {
  it('maps enhanced entropy into a stable summary contract', () => {
    const summary = buildUniquenessSummary({
      browser: {
        confidence: 90,
        entropy: 7.4,
        breakdown: {},
        detailedSignals: [
          {
            message: 'Platform mismatch between navigator.platform and User-Agent',
            impact: 'high',
            scorePenalty: 25,
            explanation: 'Mismatch',
          },
        ],
      },
      location: {
        confidence: 85,
        entropy: 4.2,
        breakdown: {},
        detailedSignals: [],
      },
      ipAddress: {
        confidence: 92,
        entropy: 6.5,
        breakdown: {},
        detailedSignals: [
          {
            message: 'IP address belongs to VPN service',
            impact: 'medium',
            scorePenalty: 25,
            explanation: 'VPN',
          },
        ],
      },
      hardware: {
        confidence: 88,
        entropy: 8.1,
        breakdown: {},
        detailedSignals: [
          {
            message: 'Canvas fingerprint collected successfully',
            impact: 'info',
            scorePenalty: 0,
            explanation: 'Canvas',
          },
        ],
      },
      software: {
        confidence: 84,
        entropy: 3.9,
        breakdown: {},
        detailedSignals: [],
      },
    });

    expect(summary.uniquenessScore).toBeGreaterThan(60);
    expect(summary.entropyBand).toBe('moderate');
    expect(summary.standoutPanels[0]).toContain('Hardware');
    expect(summary.whatMakesYouUnique).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Browser: Platform mismatch'),
        expect.stringContaining('Ip Address: IP address belongs to VPN service'),
      ])
    );
  });
});
