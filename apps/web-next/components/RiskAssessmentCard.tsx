'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Shield, ShieldAlert, AlertTriangle, OctagonAlert, CheckCircle2, AlertCircle } from 'lucide-react';
import { ProgressBar } from '@tremor/react';
import { useTranslations } from '@/lib/translations';
import type { RiskAssessment, RiskLevel } from '@/types/report';
import { Skeleton } from '@/components/LoadingStates/Skeleton';

interface RiskAssessmentCardProps {
  data?: RiskAssessment;
  isLoading?: boolean;
}

const RiskAssessmentCardComponent = ({ data, isLoading }: RiskAssessmentCardProps) => {
  const t = useTranslations('risk.levels');
  const tDesc = useTranslations('risk.descriptions');

  const RISK_LEVEL_CONFIG: Record<
    RiskLevel,
    {
      label: string;
      color: string;
      bgColor: string;
      Icon: typeof Shield;
      barColor: 'emerald' | 'yellow' | 'orange' | 'rose';
      description: string;
    }
  > = {
    low: {
      label: t('low'),
      color: 'text-emerald-300',
      bgColor: 'bg-emerald-500/10 border-emerald-400/30',
      Icon: Shield,
      barColor: 'emerald',
      description: tDesc('low'),
    },
    medium: {
      label: t('medium'),
      color: 'text-yellow-300',
      bgColor: 'bg-yellow-500/10 border-yellow-400/30',
      Icon: ShieldAlert,
      barColor: 'yellow',
      description: tDesc('medium'),
    },
    high: {
      label: t('high'),
      color: 'text-orange-300',
      bgColor: 'bg-orange-500/10 border-orange-400/30',
      Icon: AlertTriangle,
      barColor: 'orange',
      description: tDesc('high'),
    },
    critical: {
      label: t('critical'),
      color: 'text-rose-300',
      bgColor: 'bg-rose-500/10 border-rose-400/30',
      Icon: OctagonAlert,
      barColor: 'rose',
      description: tDesc('critical'),
    },
  };
  if (isLoading) {
    return (
      <div className="glass-panel rounded-2xl p-6">
        <div className="space-y-4">
          <Skeleton variant="text" width="50%" height={28} />
          <Skeleton variant="rectangular" width="100%" height={20} />
          <div className="grid gap-3 mt-4">
            <Skeleton variant="rectangular" width="100%" height={60} />
            <Skeleton variant="rectangular" width="100%" height={80} />
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="glass-panel rounded-2xl p-6 min-h-[200px] flex items-center justify-center">
        <p className="text-sm text-slate-400">No risk assessment data available</p>
      </div>
    );
  }

  const { overall_score, overall_level, factors, recommendation } = data;
  const { Icon, label, color, bgColor, barColor, description } = RISK_LEVEL_CONFIG[overall_level];

  // Calculate percentage (0-100 scale)
  const riskPercentage = Math.min(100, Math.max(0, overall_score));

  return (
    <motion.div
      className="glass-panel rounded-2xl p-6 border border-white/5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xs uppercase tracking-wider text-slate-400 font-medium mb-3">Overall Risk Assessment</h3>
        <div className="flex items-center gap-4">
          <motion.div
            className={`p-4 rounded-2xl border ${bgColor}`}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <Icon className={color} size={40} strokeWidth={2} />
          </motion.div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2 mb-1">
              <motion.p
                className={`text-3xl font-bold ${color}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                {label}
              </motion.p>
              <span className={`text-xl font-semibold ${color}`}>({riskPercentage}/100)</span>
            </div>
            <p className="text-sm text-slate-400">{description}</p>
          </div>
        </div>
      </div>

      {/* Risk Score Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-400">Risk Score</span>
          <span className={color}>{riskPercentage}%</span>
        </div>
        <ProgressBar value={riskPercentage} color={barColor} className="h-3" />
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>Safe</span>
          <span>Risky</span>
        </div>
      </div>

      {/* Risk Factors */}
      {factors.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="text-slate-400" size={16} />
            <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              Risk Factors ({factors.length})
            </p>
          </div>
          <div className="space-y-2">
            {factors.map((factor, index) => (
              <motion.div
                key={factor}
                className="flex items-start gap-3 rounded-xl border border-white/5 bg-black/20 p-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <motion.div
                  className={`h-2 w-2 rounded-full mt-1.5 ${
                    overall_level === 'critical'
                      ? 'bg-rose-400'
                      : overall_level === 'high'
                        ? 'bg-orange-400'
                        : overall_level === 'medium'
                          ? 'bg-yellow-400'
                          : 'bg-emerald-400'
                  }`}
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                />
                <span className="text-sm text-slate-300 flex-1">{factor}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendation */}
      <motion.div
        className={`rounded-2xl border p-4 ${
          overall_level === 'low'
            ? 'bg-emerald-500/5 border-emerald-400/20'
            : overall_level === 'medium'
              ? 'bg-yellow-500/5 border-yellow-400/20'
              : overall_level === 'high'
                ? 'bg-orange-500/5 border-orange-400/20'
                : 'bg-rose-500/5 border-rose-400/20'
        }`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-start gap-3">
          <CheckCircle2
            className={
              overall_level === 'low'
                ? 'text-emerald-300'
                : overall_level === 'medium'
                  ? 'text-yellow-300'
                  : overall_level === 'high'
                    ? 'text-orange-300'
                    : 'text-rose-300'
            }
            size={20}
            strokeWidth={2}
          />
          <div className="flex-1">
            <p
              className={`text-xs uppercase tracking-wider font-semibold mb-1 ${
                overall_level === 'low'
                  ? 'text-emerald-200'
                  : overall_level === 'medium'
                    ? 'text-yellow-200'
                    : overall_level === 'high'
                      ? 'text-orange-200'
                      : 'text-rose-200'
              }`}
            >
              Recommendation
            </p>
            <p className="text-sm text-slate-200 leading-relaxed">{recommendation}</p>
          </div>
        </div>
      </motion.div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <motion.div
          className="text-center p-3 rounded-xl bg-black/20 border border-white/5"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <p className={`text-2xl font-bold ${color}`}>{riskPercentage}</p>
          <p className="text-xs text-slate-400 mt-1">Risk Score</p>
        </motion.div>
        <motion.div
          className="text-center p-3 rounded-xl bg-black/20 border border-white/5"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.45 }}
        >
          <p className="text-2xl font-bold text-white">{factors.length}</p>
          <p className="text-xs text-slate-400 mt-1">Factors</p>
        </motion.div>
        <motion.div
          className="text-center p-3 rounded-xl bg-black/20 border border-white/5"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className={`text-lg font-bold ${color}`}>{label.split(' ')[0]}</p>
          <p className="text-xs text-slate-400 mt-1">Level</p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export const RiskAssessmentCard = memo(RiskAssessmentCardComponent);
