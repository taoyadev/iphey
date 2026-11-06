import type { ReportResponse } from '../../types/report';

const UNIQUENESS_PANEL_ORDER = ['hardware', 'browser', 'ipAddress', 'location', 'software'] as const;
type UniquenessSummary = NonNullable<ReportResponse['uniqueness']>;

const clamp = (value: number) => Math.max(0, Math.min(100, value));

const toTitle = (value: string) =>
  value
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, char => char.toUpperCase())
    .trim();

const bandFromScore = (score: number): UniquenessSummary['entropyBand'] => {
  if (score >= 80) return 'high';
  if (score >= 60) return 'moderate';
  return 'low';
};

const distinctivenessCopy = (band: UniquenessSummary['entropyBand']) => {
  if (band === 'high') {
    return 'Your browser, device, and network combination looks uncommon across the web.';
  }

  if (band === 'moderate') {
    return 'Your setup has some distinctive signals, but it still overlaps with broader user populations.';
  }

  return 'Your setup looks comparatively common, which generally reduces fingerprint uniqueness.';
};

export const buildUniquenessSummary = (enhanced: NonNullable<ReportResponse['enhanced']>): UniquenessSummary => {
  const panels = UNIQUENESS_PANEL_ORDER.map(panel => ({
    panel,
    entropy: enhanced[panel].entropy,
    signals: enhanced[panel].detailedSignals,
  })).sort((left, right) => right.entropy - left.entropy);

  const entropyAverage = panels.reduce((total, panel) => total + panel.entropy, 0) / panels.length;
  const uniquenessScore = clamp(Math.round((entropyAverage / 8.5) * 100));
  const entropyBand = bandFromScore(uniquenessScore);

  const standoutPanels = panels
    .slice(0, 3)
    .map(panel => `${toTitle(panel.panel)} (${panel.entropy.toFixed(1)} entropy)`);

  const whatMakesYouUnique = panels
    .flatMap(panel =>
      panel.signals
        .filter(signal => signal.impact !== 'info')
        .slice(0, 2)
        .map(signal => `${toTitle(panel.panel)}: ${signal.message}`)
    )
    .slice(0, 4);

  return {
    uniquenessScore,
    entropyBand,
    entropyAverage: Number(entropyAverage.toFixed(2)),
    estimatedDistinctiveness: distinctivenessCopy(entropyBand),
    standoutPanels,
    whatMakesYouUnique:
      whatMakesYouUnique.length > 0
        ? whatMakesYouUnique
        : ['Your current fingerprint does not expose standout anomalies.'],
  };
};
