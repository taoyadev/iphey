'use client';
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from '@/lib/translations';
import type { PanelStatus, ReportResponse } from '@/types/report';

const STATUS_COLORS: Record<PanelStatus, string> = {
  trustworthy: '#10B981',
  suspicious: '#F59E0B',
  unreliable: '#EF4444',
};

const STATUS_BG_COLORS: Record<PanelStatus, string> = {
  trustworthy: 'bg-emerald-500/10',
  suspicious: 'bg-amber-500/10',
  unreliable: 'bg-red-500/10',
};

const STATUS_BORDER_COLORS: Record<PanelStatus, string> = {
  trustworthy: 'border-emerald-500/30',
  suspicious: 'border-amber-500/30',
  unreliable: 'border-red-500/30',
};

type PanelKey = 'browser' | 'location' | 'ipAddress' | 'hardware' | 'software';

const PANEL_ICONS: Record<PanelKey, React.ReactNode> = {
  browser: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  ),
  location: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  ipAddress: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
    </svg>
  ),
  hardware: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
    </svg>
  ),
  software: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  ),
};

interface InteractiveRadarChartProps {
  data?: ReportResponse['panels'];
  onPanelClick?: (panel: PanelKey) => void;
  activePanel?: PanelKey;
}

// Custom circular progress component
const CircularProgress = ({
  score,
  status,
  size = 200,
  strokeWidth = 12
}: {
  score: number;
  status: PanelStatus;
  size?: number;
  strokeWidth?: number;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const center = size / 2;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-white/5"
        />
        {/* Progress circle */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={STATUS_COLORS[status]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 8px ${STATUS_COLORS[status]}40)` }}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-4xl font-bold text-white"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {score}
        </motion.span>
        <span className="text-sm text-slate-400 mt-1">/ 100</span>
      </div>
    </div>
  );
};

// Mini progress bar for panel items
const MiniProgressBar = ({ score, status }: { score: number; status: PanelStatus }) => (
  <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
    <motion.div
      className="h-full rounded-full"
      style={{ backgroundColor: STATUS_COLORS[status] }}
      initial={{ width: 0 }}
      animate={{ width: `${score}%` }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    />
  </div>
);

export const InteractiveRadarChart = ({ data, onPanelClick, activePanel }: InteractiveRadarChartProps) => {
  const t = useTranslations('interactiveRadar');

  const overallScore = useMemo(() => {
    if (!data) return 0;
    const scores = Object.values(data).map(d => d.score);
    return Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
  }, [data]);

  const overallStatus = useMemo((): PanelStatus => {
    if (!data) return 'trustworthy';
    const statuses = Object.values(data).map(d => d.status);
    if (statuses.some(s => s === 'unreliable')) return 'unreliable';
    if (statuses.some(s => s === 'suspicious')) return 'suspicious';
    return 'trustworthy';
  }, [data]);

  if (!data) {
    return (
      <div className="flex h-80 w-full items-center justify-center">
        <div className="text-center">
          <div className="mb-2 h-12 w-12 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
          <p className="text-sm text-slate-400">{t('analyzingFingerprint')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Content - Chart and Panel List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-6 lg:grid-cols-5"
      >
        {/* Circular Progress - Left Side (2 cols) */}
        <div className="lg:col-span-2 flex flex-col items-center justify-center">
          <div className={`rounded-3xl border ${STATUS_BORDER_COLORS[overallStatus]} ${STATUS_BG_COLORS[overallStatus]} p-8`}>
            <CircularProgress score={overallScore} status={overallStatus} size={180} strokeWidth={10} />
            <motion.div
              className="text-center mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: `${STATUS_COLORS[overallStatus]}20`,
                  color: STATUS_COLORS[overallStatus]
                }}
              >
                <div
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: STATUS_COLORS[overallStatus] }}
                />
                {t(`status.${overallStatus}`)}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Panel Breakdown - Right Side (3 cols) */}
        <div className="lg:col-span-3 rounded-2xl border border-white/5 bg-surface/40 p-5">
          <h3 className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wider">
            Identity Breakdown
          </h3>
          <div className="space-y-2">
            {(Object.entries(data) as [PanelKey, typeof data[PanelKey]][]).map(([key, panel], index) => {
              const isActive = activePanel === key;
              const panelStatus = panel.status as PanelStatus;

              return (
                <motion.button
                  key={key}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.01, x: 4 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => onPanelClick?.(key)}
                  className={`
                    w-full flex items-center gap-4 rounded-xl border p-3.5 text-left transition-all
                    ${isActive
                      ? `${STATUS_BORDER_COLORS[panelStatus]} ${STATUS_BG_COLORS[panelStatus]}`
                      : 'border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]'
                    }
                  `}
                >
                  {/* Icon */}
                  <div
                    className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: `${STATUS_COLORS[panelStatus]}15`,
                      color: STATUS_COLORS[panelStatus]
                    }}
                  >
                    {PANEL_ICONS[key]}
                  </div>

                  {/* Label and Progress */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-white truncate">
                        {t(`panels.${key}`)}
                      </span>
                      <span
                        className="text-sm font-semibold ml-2"
                        style={{ color: STATUS_COLORS[panelStatus] }}
                      >
                        {panel.score}
                      </span>
                    </div>
                    <MiniProgressBar score={panel.score} status={panelStatus} />
                  </div>

                  {/* Status Badge */}
                  <div
                    className="flex-shrink-0 px-2.5 py-1 rounded-md text-xs font-medium"
                    style={{
                      backgroundColor: `${STATUS_COLORS[panelStatus]}15`,
                      color: STATUS_COLORS[panelStatus]
                    }}
                  >
                    {t(`status.${panelStatus}`)}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Insights */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className={`rounded-xl border ${STATUS_BORDER_COLORS[overallStatus]} ${STATUS_BG_COLORS[overallStatus]} p-4`}
      >
        <div className="flex items-start gap-3">
          <div
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5"
            style={{ backgroundColor: `${STATUS_COLORS[overallStatus]}20` }}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke={STATUS_COLORS[overallStatus]}
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-white text-sm mb-1">{t('keyInsights')}</h4>
            <div className="space-y-0.5 text-xs text-slate-300">
              {overallStatus === 'unreliable' && <p>{t('multipleConflicts')}</p>}
              {overallStatus === 'suspicious' && <p>{t('inconsistenciesFound')}</p>}
              {overallStatus === 'trustworthy' && <p>{t('strongConsistency')}</p>}
              <p className="text-slate-500">{t('clickPanel')}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
