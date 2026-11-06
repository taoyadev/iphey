'use client';

import { Suspense } from 'react';
import { ExternalLink } from 'lucide-react';
import { DetailedFingerprintData } from '@/components/DetailedFingerprintData';
import { PanelCard } from '@/components/PanelCard';
import { PanelDetail } from '@/components/PanelDetail';
import { PanelCardsSkeleton } from '@/components/LoadingStates/ReportSkeleton';
import type { PanelKey } from '@/types/report';
import type { HomeOverviewProps } from '@/components/home/types';
import { SectionLoader } from '@/components/home/SectionLoader';

export default function OverviewSection({
  reportData,
  enhancedIPData,
  isLoading,
  activePanel,
  panelCopy,
  onPanelClick,
  active,
  fingerprint,
}: HomeOverviewProps) {
  if (!reportData && !isLoading) {
    return (
      <div className="space-y-8">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">Identity checks</h2>
            <p className="mt-1 text-sm text-slate-400">
              Start with the static shell, then run a live analysis when you want panel-by-panel telemetry.
            </p>
          </div>
          <p className="text-sm text-slate-400">No automatic fingerprint collection on first paint</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ['Browser', 'Client fingerprint signals stay idle until you trigger the scan.'],
            ['Location', 'Timezone and geo consistency checks run only on demand.'],
            ['IP Address', 'ASN and reputation lookups are deferred to live analysis.'],
            ['Hardware', 'Canvas, WebGL, audio, and fonts stay out of the first paint path.'],
          ].map(([title, description]) => (
            <div key={title} className="rounded-3xl border border-white/5 bg-surface/60 p-5">
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-400">{description}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="rounded-3xl border border-white/5 bg-surface/60 p-6">
            <h3 className="text-lg font-semibold text-white">Why the shell is lighter now</h3>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              The homepage now ships a stable static overview first. Heavy fingerprint collection, IP enrichment, and
              remediation surfaces move behind the live-analysis action so the first viewport is faster and more stable.
            </p>
          </div>

          <div className="min-h-[220px] space-y-4 rounded-3xl border border-white/5 bg-surface/60 p-6">
            <h3 className="text-lg font-semibold text-white">Extended toolkit</h3>
            <p className="text-sm text-slate-400">
              Leak analysis, historical tracking, and panel diagnostics are still available once you trigger a real
              scan.
            </p>
            <a
              href="/leaks"
              className="inline-flex items-center justify-center rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/20"
            >
              Open extended tools <ExternalLink size={16} className="ml-2" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Identity checks</h2>
          <p className="mt-1 text-sm text-slate-400">
            Inspect which panel contributes the most trust or uniqueness pressure.
          </p>
        </div>
        <p className="text-sm text-slate-400">Select a panel to inspect its signals</p>
      </div>

      {isLoading && !reportData ? (
        <PanelCardsSkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Object.entries(panelCopy).map(([key, meta]) => (
            <PanelCard
              key={key}
              id={key as PanelKey}
              title={meta.title}
              description={meta.description}
              panel={reportData?.panels[key as PanelKey]}
              active={activePanel === key}
              onSelect={onPanelClick}
              isLoading={isLoading}
            />
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <PanelDetail title={panelCopy[activePanel].title} panel={active} />

        <div className="min-h-[260px] space-y-4 rounded-3xl border border-white/5 bg-surface/60 p-6">
          <h3 className="text-lg font-semibold text-white">Extended toolkit</h3>
          <p className="text-sm text-slate-400">
            Move from summary panels into leak testing and remediation workflows.
          </p>
          <a
            href="/leaks"
            className="inline-flex items-center justify-center rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/20"
          >
            Open extended tools <ExternalLink size={16} className="ml-2" />
          </a>
          <div className="rounded-2xl border border-accent/20 bg-accent/5 p-4 text-sm text-slate-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">Why it matters</p>
            <p className="mt-2">
              High uniqueness is not always bad, but it tells you where a setup is unusually revealing or unstable. Use
              the detailed analysis tab to see the exact signals behind the shift.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-xl font-semibold text-white">What websites see about you</h3>
        <Suspense fallback={<SectionLoader message="Loading fingerprint data..." />}>
          <DetailedFingerprintData
            fingerprint={fingerprint ?? undefined}
            enhancedIP={enhancedIPData}
            reportIP={reportData?.ip}
          />
        </Suspense>
      </div>
    </div>
  );
}
