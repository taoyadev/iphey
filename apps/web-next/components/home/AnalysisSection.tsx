'use client';

import type { HomeAnalysisProps } from '@/components/home/types';

const impactStyles = {
  critical: 'border-red-500/20 bg-red-500/5',
  high: 'border-orange-500/20 bg-orange-500/5',
  medium: 'border-yellow-500/20 bg-yellow-500/5',
  low: 'border-blue-500/20 bg-blue-500/5',
  info: 'border-green-500/20 bg-green-500/5',
} as const;

const impactBadgeStyles = {
  critical: 'bg-red-500/20 text-red-400',
  high: 'bg-orange-500/20 text-orange-400',
  medium: 'bg-yellow-500/20 text-yellow-400',
  low: 'bg-blue-500/20 text-blue-400',
  info: 'bg-green-500/20 text-green-400',
} as const;

export default function AnalysisSection({ reportData, panelCopy }: HomeAnalysisProps) {
  return (
    <div className="space-y-6">
      {reportData?.enhanced &&
        Object.entries(reportData.enhanced).map(([panel, enhanced]) => {
          const panelKey = panel as keyof typeof reportData.enhanced;
          const panelData = reportData.panels[panelKey];

          return (
            <div key={panel} className="rounded-3xl border border-white/5 bg-surface/60 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white">{panelCopy[panelKey].title} analysis</h3>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">{panelData.score}</div>
                    <div className="text-xs text-slate-400">Score</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-accent">{enhanced.confidence}%</div>
                    <div className="text-xs text-slate-400">Confidence</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-slate-300">{enhanced.entropy.toFixed(1)}</div>
                    <div className="text-xs text-slate-400">Entropy</div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="mb-3 font-medium text-white">Breakdown</h4>
                <div className="space-y-2">
                  {Object.entries(enhanced.breakdown).map(([category, score]) => (
                    <div key={category} className="flex items-center gap-3">
                      <span className="w-24 text-sm capitalize text-slate-400">{category}:</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full bg-gradient-to-r from-accent to-accent/60 transition-all duration-500"
                          style={{ width: `${Math.max(0, score)}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-sm text-slate-300">{Math.max(0, score)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="mb-3 font-medium text-white">Detailed signals</h4>
                <div className="space-y-3">
                  {enhanced.detailedSignals.map((signal, index) => (
                    <div
                      key={`${signal.message}-${index}`}
                      className={`rounded-xl border p-4 ${impactStyles[signal.impact]}`}
                    >
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${impactBadgeStyles[signal.impact]}`}
                          >
                            {signal.impact.toUpperCase()}
                          </span>
                          <span className="text-sm font-medium text-white">{signal.message}</span>
                        </div>
                        {signal.scorePenalty > 0 && (
                          <span className="text-sm text-red-400">-{signal.scorePenalty}</span>
                        )}
                      </div>
                      <p className="mb-2 text-xs text-slate-300">{signal.explanation}</p>
                      {signal.recommendation && <p className="text-xs text-accent">Tip: {signal.recommendation}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
}
