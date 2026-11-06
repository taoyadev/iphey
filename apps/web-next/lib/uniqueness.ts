import type { ReportResponse } from '@/types/report';

const PANEL_ORDER = ['hardware', 'browser', 'ipAddress', 'location', 'software'] as const;

export const deriveUniquenessSummary = (report: Pick<ReportResponse, 'enhanced' | 'uniqueness'>) => {
  if (report.uniqueness) {
    return report.uniqueness;
  }

  if (!report.enhanced) {
    return {
      uniquenessScore: 58,
      entropyBand: 'low' as const,
      entropyAverage: 4.9,
      estimatedDistinctiveness: 'Collect a live report to see which browser and network traits stand out most.',
      standoutPanels: ['Live report required'],
      whatMakesYouUnique: ['Run a new analysis to calculate fingerprint uniqueness from live signals.'],
    };
  }

  const enhanced = report.enhanced;
  const panels = PANEL_ORDER.map(panel => ({
    panel,
    entropy: enhanced[panel].entropy,
    signals: enhanced[panel].detailedSignals,
  })).sort((left, right) => right.entropy - left.entropy);

  const entropyAverage = panels.reduce((total, panel) => total + panel.entropy, 0) / panels.length;
  const uniquenessScore = Math.max(0, Math.min(100, Math.round((entropyAverage / 8.5) * 100)));
  const entropyBand = uniquenessScore >= 80 ? 'high' : uniquenessScore >= 60 ? 'moderate' : 'low';

  const uniqueSignals = panels
    .flatMap(panel =>
      panel.signals
        .filter(signal => signal.impact !== 'info')
        .slice(0, 2)
        .map(signal => `${panel.panel}: ${signal.message}`)
    )
    .slice(0, 4);

  return {
    uniquenessScore,
    entropyBand,
    entropyAverage: Number(entropyAverage.toFixed(2)),
    estimatedDistinctiveness:
      entropyBand === 'high'
        ? 'Your current browser and network signature looks uncommon.'
        : entropyBand === 'moderate'
          ? 'A few parts of your setup are distinctive enough to separate you from a broad crowd.'
          : 'This setup looks comparatively common, which usually lowers uniqueness.',
    standoutPanels: panels.slice(0, 3).map(panel => `${panel.panel} (${panel.entropy.toFixed(1)})`),
    whatMakesYouUnique: uniqueSignals.length > 0 ? uniqueSignals : ['No standout signals detected.'],
  };
};
