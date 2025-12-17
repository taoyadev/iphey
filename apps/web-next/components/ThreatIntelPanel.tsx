'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Shield, ShieldAlert, AlertTriangle, OctagonAlert } from 'lucide-react';
import { ProgressBar } from '@tremor/react';
import { useTranslations } from '@/lib/translations';
import type { ThreatIntelligence, ThreatLevel } from '@/types/report';
import { Skeleton } from '@/components/LoadingStates/Skeleton';

interface ThreatIntelPanelProps {
  data?: ThreatIntelligence;
  isLoading?: boolean;
}

const ThreatIntelPanelComponent = ({ data, isLoading }: ThreatIntelPanelProps) => {
  const t = useTranslations('risk.levels');
  const tThreats = useTranslations('threats');

  const THREAT_LEVEL_CONFIG: Record<
    ThreatLevel,
    {
      label: string;
      color: string;
      bgColor: string;
      Icon: typeof Shield;
      barColor: 'emerald' | 'yellow' | 'orange' | 'rose';
    }
  > = {
    low: {
      label: t('low'),
      color: 'text-emerald-300',
      bgColor: 'bg-emerald-500/10 border-emerald-400/30',
      Icon: Shield,
      barColor: 'emerald',
    },
    medium: {
      label: t('medium'),
      color: 'text-yellow-300',
      bgColor: 'bg-yellow-500/10 border-yellow-400/30',
      Icon: ShieldAlert,
      barColor: 'yellow',
    },
    high: {
      label: t('high'),
      color: 'text-orange-300',
      bgColor: 'bg-orange-500/10 border-orange-400/30',
      Icon: AlertTriangle,
      barColor: 'orange',
    },
    critical: {
      label: t('critical'),
      color: 'text-rose-300',
      bgColor: 'bg-rose-500/10 border-rose-400/30',
      Icon: OctagonAlert,
      barColor: 'rose',
    },
  };
  if (isLoading) {
    return (
      <div className="glass-panel rounded-2xl p-6">
        <div className="space-y-4">
          <Skeleton variant="text" width="50%" height={28} />
          <Skeleton variant="rectangular" width="100%" height={20} />
          <Skeleton variant="text" width="80%" />
          <div className="grid gap-3 mt-4">
            <Skeleton variant="rectangular" width="100%" height={80} />
            <Skeleton variant="rectangular" width="100%" height={80} />
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="glass-panel rounded-2xl p-6 min-h-[200px] flex items-center justify-center">
        <p className="text-sm text-slate-400">{tThreats('noData')}</p>
      </div>
    );
  }

  const { combined, providers } = data;
  const { Icon, label, color, bgColor, barColor } = THREAT_LEVEL_CONFIG[combined.threat_level];

  return (
    <motion.div
      className="glass-panel rounded-2xl p-6 border border-white/5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xs uppercase tracking-wider text-slate-400 font-medium mb-2">Threat Intelligence</h3>
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              <Icon className={color} size={32} strokeWidth={2} />
            </motion.div>
            <div>
              <p className={`text-2xl font-bold ${color}`}>{label}</p>
              <p className="text-sm text-slate-400">
                {combined.is_malicious ? tThreats('maliciousDetected') : tThreats('noThreatsDetected')}
              </p>
            </div>
          </div>
        </div>
        <div className={`px-4 py-2 rounded-full border ${bgColor} ${color} font-semibold text-lg`}>
          {combined.threat_score}/100
        </div>
      </div>

      {/* Threat Score Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-400">Threat Score</span>
          <span className={color}>{combined.threat_score}%</span>
        </div>
        <ProgressBar value={combined.threat_score} color={barColor} className="h-3" />
      </div>

      {/* Confidence Level */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-400">Analysis Confidence</span>
          <span className="text-white">{Math.round(combined.confidence * 100)}%</span>
        </div>
        <ProgressBar value={combined.confidence * 100} color="blue" className="h-2" />
      </div>

      {/* Threat Types */}
      {combined.threat_types.length > 0 && (
        <div className="mb-6">
          <p className="text-xs uppercase tracking-wider text-slate-400 mb-3">Detected Threats</p>
          <div className="flex flex-wrap gap-2">
            {combined.threat_types.map((type, index) => (
              <motion.span
                key={type}
                className="px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-400/30 text-rose-200 text-xs font-medium"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                {type}
              </motion.span>
            ))}
          </div>
        </div>
      )}

      {/* Provider Details */}
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-wider text-slate-400 mb-3">Data Sources</p>

        {/* AbuseIPDB */}
        {providers.abuseipdb && (
          <motion.div
            className="rounded-xl border border-white/5 bg-black/20 p-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">AbuseIPDB</span>
                {providers.abuseipdb.is_listed && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-200 text-xs">Listed</span>
                )}
              </div>
              {providers.abuseipdb.reports !== undefined && (
                <span className="text-xs text-slate-400">{providers.abuseipdb.reports} reports</span>
              )}
            </div>
            {providers.abuseipdb.threat_types.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {providers.abuseipdb.threat_types.map(type => (
                  <span key={type} className="px-2 py-0.5 rounded bg-slate-700/50 text-slate-300 text-xs">
                    {type}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Confidence: {Math.round(providers.abuseipdb.confidence * 100)}%
              </span>
              {providers.abuseipdb.last_checked && (
                <span className="text-xs text-slate-500">
                  {new Date(providers.abuseipdb.last_checked).toLocaleDateString()}
                </span>
              )}
            </div>
            {providers.abuseipdb.error && <p className="text-xs text-amber-300 mt-2">⚠ {providers.abuseipdb.error}</p>}
          </motion.div>
        )}

        {/* Spamhaus */}
        {providers.spamhaus && (
          <motion.div
            className="rounded-xl border border-white/5 bg-black/20 p-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">Spamhaus</span>
                {providers.spamhaus.is_listed && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-200 text-xs">Listed</span>
                )}
              </div>
              {providers.spamhaus.list_type && (
                <span className="text-xs text-slate-400">{providers.spamhaus.list_type}</span>
              )}
            </div>
            {providers.spamhaus.threat_types.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {providers.spamhaus.threat_types.map(type => (
                  <span key={type} className="px-2 py-0.5 rounded bg-slate-700/50 text-slate-300 text-xs">
                    {type}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-2">
              <span className="text-xs text-slate-400">
                Confidence: {Math.round(providers.spamhaus.confidence * 100)}%
              </span>
            </div>
            {providers.spamhaus.error && <p className="text-xs text-amber-300 mt-2">⚠ {providers.spamhaus.error}</p>}
          </motion.div>
        )}
      </div>

      {/* Timestamp */}
      <div className="mt-4 pt-4 border-t border-white/5">
        <p className="text-xs text-slate-500 text-center">Last updated: {new Date(data.timestamp).toLocaleString()}</p>
      </div>
    </motion.div>
  );
};

export const ThreatIntelPanel = memo(ThreatIntelPanelComponent);
