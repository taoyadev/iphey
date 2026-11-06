'use client';

import { Globe } from 'lucide-react';
import { ASNInfoPanel } from '@/components/ASNInfoPanel';
import { RiskAssessmentCard } from '@/components/RiskAssessmentCard';
import { ThreatIntelPanel } from '@/components/ThreatIntelPanel';
import type { HomeIpIntelProps } from '@/components/home/types';

export default function IpIntelSection({ reportData, enhancedIPData, isLoadingEnhancedIP }: HomeIpIntelProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/5 bg-surface/60 p-6">
        <div className="mb-4 flex items-center gap-4">
          <div className="rounded-xl border border-blue-400/30 bg-blue-500/10 p-3">
            <Globe className="text-blue-300" size={28} strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">IP intelligence analysis</h2>
            <p className="text-sm text-slate-400">Comprehensive IP reputation and network analysis</p>
          </div>
        </div>
        <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
          <p className="mb-1 text-xs uppercase tracking-widest text-slate-500">Observed IP address</p>
          <p className="font-mono text-2xl text-white">
            {isLoadingEnhancedIP ? '...' : (enhancedIPData?.ip ?? reportData?.ip ?? 'Detecting...')}
          </p>
          {enhancedIPData?.geolocation && (
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
              {enhancedIPData.geolocation.city && <span>{enhancedIPData.geolocation.city}</span>}
              {enhancedIPData.geolocation.region && <span>• {enhancedIPData.geolocation.region}</span>}
              {enhancedIPData.geolocation.country && <span>• {enhancedIPData.geolocation.country}</span>}
            </div>
          )}
        </div>
      </div>

      <RiskAssessmentCard data={enhancedIPData?.risk_assessment} isLoading={isLoadingEnhancedIP} />

      <div className="grid gap-6 lg:grid-cols-2">
        <ThreatIntelPanel data={enhancedIPData?.threats} isLoading={isLoadingEnhancedIP} />
        <ASNInfoPanel data={enhancedIPData?.asn_analysis} isLoading={isLoadingEnhancedIP} />
      </div>

      {enhancedIPData?.sources_used && enhancedIPData.sources_used.length > 0 && (
        <div className="rounded-3xl border border-white/5 bg-surface/60 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">Data sources</h3>
          <div className="flex flex-wrap gap-2">
            {enhancedIPData.sources_used.map(source => (
              <span
                key={source}
                className="rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-200"
              >
                {source}
              </span>
            ))}
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Last updated:{' '}
            {enhancedIPData.analysis_timestamp ? new Date(enhancedIPData.analysis_timestamp).toLocaleString() : '—'}
          </p>
        </div>
      )}
    </div>
  );
}
