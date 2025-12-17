'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import type { PanelKey, PanelResult } from '@/types/report';
import { StatusBadge } from './StatusBadge';
import { Skeleton } from './LoadingStates/Skeleton';

interface PanelCardProps {
  id?: PanelKey;
  title: string;
  description?: string;
  panel?: PanelResult;
  score?: number;
  status?: PanelResult['status'];
  insights?: string[];
  icon?: React.ReactNode;
  active?: boolean;
  onSelect?: (id: PanelKey) => void;
  isLoading?: boolean;
}

const PanelCardComponent = ({
  id,
  title,
  description,
  panel,
  score,
  status,
  insights,
  icon,
  active,
  onSelect,
  isLoading,
}: PanelCardProps) => {
  if (isLoading) {
    return (
      <div className="glass-panel rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="space-y-2 flex-1">
            <Skeleton variant="text" width="40%" />
            <Skeleton variant="text" width="50%" height={24} />
          </div>
          <Skeleton variant="rectangular" width={60} height={24} />
        </div>
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="80%" />
        <div className="mt-3 space-y-2">
          <Skeleton variant="text" width="90%" />
          <Skeleton variant="text" width="70%" />
        </div>
      </div>
    );
  }

  const resolvedScore = panel?.score ?? score;
  const resolvedStatus = panel?.status ?? status;
  const resolvedSignals = panel?.signals ?? insights;

  return (
    <motion.button
      onClick={() => id && onSelect?.(id)}
      className={clsx(
        'group relative text-left rounded-2xl p-5 border transition-all duration-300 overflow-hidden',
        'backdrop-blur-sm bg-panel/60 hover:bg-panel/80',
        active
          ? 'border-accent shadow-glow-lg ring-2 ring-accent/20'
          : 'border-white/5 hover:border-white/10 hover:shadow-xl'
      )}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {/* Gradient background on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        initial={false}
      />

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400 font-medium mb-1 flex items-center gap-2">
              {icon}
              {title}
            </p>
            <motion.p
              className="text-2xl font-bold text-white"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {typeof resolvedScore === 'number' ? `${resolvedScore}` : '—'}
              <span className="text-sm text-slate-400 ml-1">/100</span>
            </motion.p>
          </div>
          {resolvedStatus && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              <StatusBadge status={resolvedStatus} size="sm" />
            </motion.div>
          )}
        </div>

        <p className="text-sm text-slate-400 leading-relaxed line-clamp-2 mb-3">
          {description || panel?.signals?.[0] || '—'}
        </p>

        {/* Signals preview */}
        {resolvedSignals && resolvedSignals.length > 0 && (
          <motion.ul
            className="space-y-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {resolvedSignals.slice(0, 2).map((signal, index) => (
              <motion.li
                key={signal}
                className="flex items-start gap-2 text-xs text-slate-300"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <motion.span
                  className="h-1.5 w-1.5 rounded-full bg-accent mt-1 flex-shrink-0"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: index * 0.5 }}
                />
                <span className="line-clamp-1">{signal}</span>
              </motion.li>
            ))}
            {resolvedSignals.length > 2 && (
              <motion.li
                className="text-xs text-accent font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                +{resolvedSignals.length - 2} more
              </motion.li>
            )}
          </motion.ul>
        )}

        {/* Active indicator */}
        {active && (
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-accent-light via-accent to-accent-dark"
            layoutId="activeIndicator"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        )}
      </div>
    </motion.button>
  );
};

// Memoize to prevent unnecessary re-renders when other panels change
export const PanelCard = memo(PanelCardComponent);
