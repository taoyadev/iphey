'use client';

import { useTranslations } from '@/lib/translations';
import type { PanelResult, PanelStatus } from '@/types/report';
import { StatusBadge } from './StatusBadge';

interface PanelDetailProps {
  title: string;
  panel?: PanelResult;
}

export const PanelDetail = ({ title, panel }: PanelDetailProps) => {
  const t = useTranslations('panelDetail');

  const statusCopy: Record<PanelStatus, string> = {
    trustworthy: t('trustworthyDesc'),
    suspicious: t('suspiciousDesc'),
    unreliable: t('unreliableDesc'),
  };
  if (!panel) {
    return (
      <div className="rounded-3xl border border-white/5 bg-panel/60 p-6 min-h-[200px]">
        <p className="text-sm text-slate-400">Select a panel to inspect its signals.</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/5 bg-panel/60 p-6 min-h-[260px] flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400 uppercase tracking-widest">{title}</p>
          <p className="text-3xl font-semibold text-white">{panel.score}/100</p>
        </div>
        <StatusBadge status={panel.status} />
      </div>
      <p className="text-sm text-slate-300">{statusCopy[panel.status]}</p>
      <div>
        <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Signals</p>
        <div className="grid gap-2">
          {panel.signals.map(signal => (
            <div key={signal} className="rounded-xl border border-white/5 bg-black/20 px-4 py-2 text-sm text-slate-200">
              {signal}
            </div>
          ))}
        </div>
      </div>
      {panel.remediation && (
        <div className="rounded-2xl border border-amber-400/20 bg-amber-500/5 p-4 text-sm text-amber-100">
          <p className="font-semibold uppercase tracking-wide text-xs text-amber-200">Tip</p>
          {panel.remediation}
        </div>
      )}
    </div>
  );
};
