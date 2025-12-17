'use client';

import { useEffect, useState } from 'react';
import { motion, animate } from 'framer-motion';
import type { Verdict } from '../types/report';

const STATUS_COLORS: Record<Verdict, { primary: string; secondary: string; gradient: string }> = {
  trustworthy: {
    primary: '#01AE7D',
    secondary: '#02c98d',
    gradient: 'from-[#01AE7D] to-[#02c98d]',
  },
  suspicious: {
    primary: '#FACC15',
    secondary: '#fde047',
    gradient: 'from-[#FACC15] to-[#fde047]',
  },
  unreliable: {
    primary: '#F87171',
    secondary: '#fca5a5',
    gradient: 'from-[#F87171] to-[#fca5a5]',
  },
};

interface ScoreDialProps {
  score?: number;
  status?: Verdict;
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  isLoading?: boolean;
}

const sizeMap = {
  sm: { width: 120, strokeWidth: 8, fontSize: 'text-3xl' },
  md: { width: 160, strokeWidth: 10, fontSize: 'text-4xl' },
  lg: { width: 200, strokeWidth: 12, fontSize: 'text-5xl' },
};

export const ScoreDial = ({
  score = 0,
  status = 'trustworthy',
  size = 'md',
  showPercentage = false,
  isLoading = false,
}: ScoreDialProps) => {
  const [displayScore, setDisplayScore] = useState(0);
  const { width, strokeWidth, fontSize } = sizeMap[size];
  const radius = (width - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const clamped = Math.min(100, Math.max(0, score));
  const colors = STATUS_COLORS[status];

  // Animate score counter
  useEffect(() => {
    if (isLoading) return;

    const controls = animate(displayScore, clamped, {
      duration: 1.5,
      ease: 'easeOut',
      onUpdate: latest => setDisplayScore(Math.round(latest)),
    });

    return controls.stop;
  }, [clamped, isLoading, displayScore]);

  // Calculate stroke offset for circular progress
  const strokeOffset = circumference - (displayScore / 100) * circumference;

  return (
    <div className="relative" style={{ width, height: width }}>
      {/* Background glow effect */}
      <motion.div
        className="absolute inset-0 rounded-full opacity-20 blur-2xl"
        style={{ backgroundColor: colors.primary }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.2, 0.3, 0.2],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* SVG Circle Progress */}
      <svg width={width} height={width} className="relative z-10 -rotate-90">
        {/* Background circle */}
        <circle
          cx={width / 2}
          cy={width / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth={strokeWidth}
        />

        {/* Progress circle */}
        <motion.circle
          cx={width / 2}
          cy={width / 2}
          r={radius}
          fill="none"
          stroke={`url(#gradient-${status})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: strokeOffset }}
          transition={{
            duration: 1.5,
            ease: 'easeOut',
          }}
        />

        {/* Gradient definition */}
        <defs>
          <linearGradient id={`gradient-${status}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.primary} />
            <stop offset="100%" stopColor={colors.secondary} />
          </linearGradient>
        </defs>
      </svg>

      {/* Center content */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        {isLoading ? (
          <div className="flex flex-col items-center">
            <motion.div
              className="h-8 w-8 rounded-full border-4 border-accent border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <span className="text-xs text-slate-400 mt-2">Loading...</span>
          </div>
        ) : (
          <>
            <motion.span
              className={`${fontSize} font-bold text-white leading-none`}
              key={displayScore}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {displayScore}
              {showPercentage && <span className="text-xl ml-0.5">%</span>}
            </motion.span>
            <span className="text-xs uppercase tracking-[0.3em] text-slate-400 mt-2">{status}</span>
          </>
        )}
      </motion.div>

      {/* Decorative particles */}
      {!isLoading && displayScore > 80 && (
        <>
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-1 w-1 rounded-full bg-accent"
              style={{
                top: `${20 + i * 25}%`,
                left: `${10 + i * 30}%`,
              }}
              animate={{
                y: [-10, 10, -10],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.4,
                ease: 'easeInOut',
              }}
            />
          ))}
        </>
      )}
    </div>
  );
};
