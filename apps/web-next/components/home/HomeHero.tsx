'use client';

import { Activity, Globe, RefreshCw } from 'lucide-react';
import { PremiumCard } from '@/components/PremiumCard';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/StatusBadge';
import type { HomeHeroProps } from '@/components/home/types';

const statusMessages = {
  trustworthy: 'Your browser and network are telling a fairly coherent story.',
  suspicious: 'A few browser or network signals stand out and deserve a second look.',
  unreliable: 'This profile contains multiple anomalies that can trigger scrutiny.',
};

export default function HomeHero({
  reportData,
  enhancedIPData,
  isLoading,
  isFetching,
  onRefresh,
  verdict,
}: HomeHeroProps) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-surface/80 p-8 md:p-12">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl space-y-5">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Digital identity inspector</p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight text-white md:text-5xl">
            Measure browser uniqueness with IP and ASN context
          </h1>
          <p className="text-lg leading-8 text-slate-300">
            IPhey combines browser fingerprint telemetry, IP reputation, ASN context, and location checks into one
            workflow. Use it to test whether your setup looks ordinary, distinctive, or contradictory.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {reportData && <StatusBadge status={verdict} />}
            <button
              onClick={onRefresh}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 font-semibold text-slate-900"
            >
              <RefreshCw className={isFetching ? 'animate-spin' : ''} size={16} />
              {isLoading ? 'Collecting telemetry' : reportData ? 'Re-run analysis' : 'Run live analysis'}
            </button>
          </div>
          <p className="text-base leading-7 text-slate-400">
            {statusMessages[verdict]} This page is structured for repeat testing across browsers, VPNs, and hosted
            network paths.
          </p>
        </div>

        <div className="w-full max-w-sm shrink-0 rounded-[2rem] border border-white/10 bg-black/10 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Current score</p>
              <p className="mt-3 text-6xl font-semibold tracking-tight text-white">{reportData?.score ?? '—'}</p>
              <p className="mt-2 text-sm text-slate-400">
                {reportData
                  ? 'Browser, location, IP, hardware, and software signals combined.'
                  : 'Run the live analysis only when you want current browser and network telemetry.'}
              </p>
            </div>
            {reportData && <StatusBadge status={verdict} size="sm" />}
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { label: 'Verdict', value: reportData ? verdict : 'Ready' },
              {
                label: 'Fetched',
                value: reportData ? new Date(reportData.fetchedAt).toLocaleTimeString() : 'On demand',
              },
              { label: 'Source', value: reportData?.source ?? 'Static shell' },
            ].map(item => (
              <div key={item.label} className="rounded-2xl border border-white/5 bg-white/3 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                <p className="mt-2 text-sm font-medium capitalize text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {reportData && (
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <PremiumCard
            delay={0.1}
            icon={<Globe className="h-6 w-6" />}
            title="Current route"
            description="Your observed IP and provider context"
          >
            <div className="space-y-3">
              <p className="text-2xl font-mono text-foreground">
                {reportData.ip === '::1' ? 'localhost (IPv6)' : reportData.ip}
              </p>
              {enhancedIPData?.asn_analysis && (
                <div className="space-y-2">
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">ASN</span>
                    <Badge variant="secondary" className="font-mono">
                      AS{enhancedIPData.asn_analysis.asn}
                    </Badge>
                  </div>
                  <div
                    className="truncate text-sm text-muted-foreground"
                    title={enhancedIPData.asn_analysis.info.org_name || enhancedIPData.asn_analysis.info.name}
                  >
                    {enhancedIPData.asn_analysis.info.org_name ||
                      enhancedIPData.asn_analysis.info.name ||
                      'Unknown provider'}
                  </div>
                </div>
              )}
            </div>
          </PremiumCard>

          <PremiumCard
            delay={0.2}
            icon={<Activity className="h-6 w-6" />}
            title="Report freshness"
            description="When this analysis was produced"
          >
            <div className="space-y-2">
              <p className="text-2xl text-foreground">{new Date(reportData.fetchedAt).toLocaleTimeString()}</p>
              <p className="text-sm text-muted-foreground">{new Date(reportData.fetchedAt).toDateString()}</p>
              {reportData.requestId && <p className="text-xs text-slate-400">Request ID: {reportData.requestId}</p>}
            </div>
          </PremiumCard>

          <PremiumCard
            delay={0.3}
            icon={<RefreshCw className="h-6 w-6" />}
            title="Data path"
            description="Source confidence for the IP layer"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-accent" />
                <span className="text-lg font-semibold text-foreground">Live-compatible</span>
              </div>
              <Badge variant="outline" className="w-fit">
                {enhancedIPData?.sources_used && enhancedIPData.sources_used.length > 0
                  ? `Sources: ${enhancedIPData.sources_used.join(', ')}`
                  : 'Browser + IP telemetry'}
              </Badge>
            </div>
          </PremiumCard>
        </div>
      )}
    </section>
  );
}
