'use client';

import Link from 'next/link';
import { deriveUniquenessSummary } from '@/lib/uniqueness';
import type { HomeUniquenessProps } from '@/components/home/types';

const bandStyles = {
  high: 'border-red-400/30 bg-red-500/10 text-red-200',
  moderate: 'border-amber-400/30 bg-amber-500/10 text-amber-200',
  low: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
};

export default function UniquenessSection({ reportData }: HomeUniquenessProps) {
  const summary = deriveUniquenessSummary({ enhanced: reportData?.enhanced, uniqueness: reportData?.uniqueness });
  const band = summary.entropyBand as keyof typeof bandStyles;

  if (!reportData) {
    return (
      <section className="rounded-[2rem] border border-white/10 bg-surface/80 p-8">
        <div className="max-w-3xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Uniqueness</p>
          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">Fingerprint distinctiveness</h2>
          <p className="text-lg leading-8 text-slate-300">
            IPhey keeps uniqueness analysis out of the initial paint path. Trigger a live scan when you want entropy,
            standout signals, and browser-plus-network distinctiveness in one report.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            {['On-demand entropy scoring', 'Browser + ASN context', 'Guide-led remediation paths'].map(item => (
              <span
                key={item}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] border border-white/10 bg-surface/80 p-8">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Uniqueness</p>
          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">Fingerprint distinctiveness</h2>
          <p className="text-lg leading-8 text-slate-300">{summary.estimatedDistinctiveness}</p>
          <div
            className={`inline-flex rounded-full border px-4 py-2 text-sm font-medium capitalize ${bandStyles[band]}`}
          >
            {summary.entropyBand} uniqueness
          </div>
        </div>

        <div className="grid w-full max-w-md gap-4 md:grid-cols-2 lg:grid-cols-1">
          <div className="rounded-3xl border border-white/5 bg-black/20 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Uniqueness score</p>
            <p className="mt-3 text-4xl font-semibold text-white">{summary.uniquenessScore}</p>
            <p className="mt-2 text-sm text-slate-400">
              Mapped from the strongest entropy-producing panels in the current report.
            </p>
          </div>
          <div className="rounded-3xl border border-white/5 bg-black/20 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Average entropy</p>
            <p className="mt-3 text-4xl font-semibold text-white">{summary.entropyAverage}</p>
            <p className="mt-2 text-sm text-slate-400">
              Higher values mean a more distinctive combination of browser and network traits.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/5 bg-black/20 p-6">
          <h3 className="text-lg font-semibold text-white">What stands out</h3>
          <ul className="mt-4 space-y-3 pl-6 text-slate-300">
            {summary.whatMakesYouUnique.map(item => (
              <li key={item} className="list-disc leading-7">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-white/5 bg-black/20 p-6">
          <h3 className="text-lg font-semibold text-white">Related next steps</h3>
          <div className="mt-4 space-y-3">
            {[
              {
                href: '/guides/how-to-reduce-browser-uniqueness',
                label: 'Reduce browser uniqueness',
              },
              {
                href: '/guides/how-iphey-scores-digital-identity',
                label: 'Understand the scoring model',
              },
              {
                href: '/vs/cover-your-tracks',
                label: 'Compare with browser-only uniqueness tools',
              },
            ].map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-slate-300 transition hover:border-accent/30 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
