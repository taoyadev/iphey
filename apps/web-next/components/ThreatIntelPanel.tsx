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

  const { Icon, label, color, bgColor, barColor } = THREAT_LEVEL_CONFIG[data.threat_level] ?? THREAT_LEVEL_CONFIG.low;
  const threatScore = data.threat_score ?? 0;
  const factors = data.factors ?? [];

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
                {data.is_malicious ? tThreats('maliciousDetected') : tThreats('noThreatsDetected')}
              </p>
            </div>
          </div>
        </div>
        <div className={`px-4 py-2 rounded-full border ${bgColor} ${color} font-semibold text-lg`}>{threatScore}/100</div>
      </div>

      {/* Threat Score Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-400">Threat Score</span>
          <span className={color}>{threatScore}%</span>
        </div>
        <ProgressBar value={threatScore} color={barColor} className="h-3" />
      </div>

      {/* Risk Factors */}
      {factors.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-wider text-slate-400 mb-3">Risk Factors</p>
          <div className="flex flex-wrap gap-2">
            {factors.map((factor, index) => (
              <motion.span
                key={factor}
                className="px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-200 text-xs font-medium"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                {factor}
              </motion.span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export const ThreatIntelPanel = memo(ThreatIntelPanelComponent);
