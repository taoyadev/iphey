'use client';

import { useEffect, useState } from 'react';
import { motion, animate } from 'framer-motion';
import { Shield, AlertTriangle, X, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import type { Verdict } from '../types/report';

const STATUS_CONFIG: Record<Verdict, {
  icon: React.ReactNode;
  label: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  thresholds: {
    good: number;
    warning: number;
    danger: number;
  };
}> = {
  trustworthy: {
    icon: <CheckCircle className="h-5 w-5" />,
    label: 'Trustworthy',
    description: 'Your identity appears legitimate and secure',
    colors: {
      primary: 'hsl(142, 76%, 36%)',
      secondary: 'hsl(142, 76%, 50%)',
      accent: 'hsl(142, 76%, 70%)',
      background: 'hsl(142, 76%, 15%)',
    },
    thresholds: { good: 70, warning: 50, danger: 30 },
  },
  suspicious: {
    icon: <AlertTriangle className="h-5 w-5" />,
    label: 'Suspicious',
    description: 'Some unusual patterns detected',
    colors: {
      primary: 'hsl(38, 92%, 50%)',
      secondary: 'hsl(38, 92%, 60%)',
      accent: 'hsl(38, 92%, 70%)',
      background: 'hsl(38, 92%, 15%)',
    },
    thresholds: { good: 60, warning: 40, danger: 20 },
  },
  unreliable: {
    icon: <X className="h-5 w-5" />,
    label: 'High Risk',
    description: 'Multiple risk factors identified',
    colors: {
      primary: 'hsl(0, 84%, 60%)',
      secondary: 'hsl(0, 84%, 70%)',
      accent: 'hsl(0, 84%, 80%)',
      background: 'hsl(0, 84%, 15%)',
    },
    thresholds: { good: 50, warning: 30, danger: 10 },
  },
};

interface ModernScoreDialProps {
  score?: number;
  status?: Verdict;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  animateOnMount?: boolean;
}

const sizeConfig = {
  sm: { width: 180, height: 180, strokeWidth: 8, fontSize: 'text-2xl', iconSize: 4 },
  md: { width: 220, height: 220, strokeWidth: 10, fontSize: 'text-3xl', iconSize: 5 },
  lg: { width: 280, height: 280, strokeWidth: 12, fontSize: 'text-4xl', iconSize: 6 },
};

export function ModernScoreDial({
  score = 0,
  status = 'trustworthy',
  size = 'md',
  showDetails = false,
  animateOnMount = true,
}: ModernScoreDialProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const { width, height, strokeWidth, fontSize, iconSize } = sizeConfig[size];
  const config = STATUS_CONFIG[status];
  const radius = (width - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate score percentage
  const scorePercentage = Math.min(100, Math.max(0, score));

  // Determine quality level
  const getQualityLevel = (score: number) => {
    if (score >= config.thresholds.good) return 'excellent';
    if (score >= config.thresholds.warning) return 'good';
    if (score >= config.thresholds.danger) return 'warning';
    return 'poor';
  };

  const qualityLevel = getQualityLevel(scorePercentage);

  // Animate score on mount
  useEffect(() => {
    if (!animateOnMount) {
      setDisplayScore(scorePercentage);
      return;
    }

    const controls = animate(0, scorePercentage, {
      duration: 1.5,
      ease: 'easeOut',
      onUpdate: (latest) => {
        setDisplayScore(latest);
      },
    });

    return controls.stop;
  }, [scorePercentage, animateOnMount]);

  // Calculate stroke progress
  const progressLength = (displayScore / 100) * circumference;
  const strokeDashoffset = circumference - progressLength;

  return (
    <div className={cn("relative flex flex-col items-center", showDetails && "space-y-4")}>
      <div className="relative">
        {/* Background glow effect */}
        <motion.div
          className="absolute inset-0 rounded-full opacity-30 blur-xl"
          style={{
            backgroundColor: config.colors.primary,
            transform: `scale(${1 + (displayScore / 100) * 0.1})`,
          }}
          animate={{
            scale: [1, 1 + (displayScore / 100) * 0.05, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 3,
            repeat: displayScore > 0 ? Infinity : 0,
            ease: 'easeInOut',
          }}
        />

        {/* Main SVG */}
        <svg
          width={width}
          height={height}
          className="relative z-10 transform -rotate-90"
        >
          {/* Background circle with glassmorphism */}
          <circle
            cx={width / 2}
            cy={height / 2}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={strokeWidth}
            className="drop-shadow-lg"
          />

          {/* Progress circle with gradient */}
          <motion.circle
            cx={width / 2}
            cy={height / 2}
            r={radius}
            fill="none"
            stroke="url(#gradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{
              duration: 1.5,
              ease: 'easeOut',
            }}
          />

          {/* Gradient definitions */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={config.colors.primary} />
              <stop offset="50%" stopColor={config.colors.accent} />
              <stop offset="100%" stopColor={config.colors.secondary} />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
        </svg>

        {/* Center content */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
        >
          {/* Score number */}
          <div className="text-center">
            <motion.div
              className={cn(
                "font-bold tracking-tight",
                fontSize,
                "text-transparent bg-clip-text bg-gradient-to-r",
                "from-foreground to-foreground/70"
              )}
              style={{
                backgroundImage: `linear-gradient(135deg, ${config.colors.primary}, ${config.colors.secondary})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
              key={displayScore}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              {Math.round(displayScore)}
            </motion.div>

            {/* Max score indicator */}
            <motion.div
              className="text-xs text-muted-foreground mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              / 100
            </motion.div>
          </div>

          {/* Status icon */}
          <motion.div
            className="mt-2"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            {config.icon}
          </motion.div>
        </div>

        {/* Decorative particles for excellent scores */}
        {qualityLevel === 'excellent' && (
          <div className="absolute inset-0">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-gradient-to-r from-accent to-primary opacity-60"
                style={{
                  top: `${20 + (i * 15)}%`,
                  left: `${10 + (i * 15)}%`,
                }}
                animate={{
                  y: [-20, 20, -20],
                  opacity: [0, 0.8, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Status information */}
      {showDetails && (
        <div className="text-center space-y-2">
          {/* Status badge */}
          <Badge
            variant={qualityLevel === 'excellent' ? 'default' : qualityLevel === 'poor' ? 'destructive' : 'secondary'}
            className="px-4 py-2"
          >
            {config.label}
          </Badge>

          {/* Description */}
          <p className="text-sm text-muted-foreground max-w-xs">
            {config.description}
          </p>

          {/* Quality indicator */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Quality:</span>
            <span className={cn(
              "font-semibold",
              qualityLevel === 'excellent' && "text-accent",
              qualityLevel === 'poor' && "text-destructive",
              qualityLevel === 'good' && "text-primary",
              qualityLevel === 'warning' && "text-primary"
            )}>
              {qualityLevel === 'excellent' ? 'Excellent' :
               qualityLevel === 'good' ? 'Good' :
               qualityLevel === 'warning' ? 'Warning' : 'Poor'}
            </span>
            <span className="text-muted-foreground">•</span>
            <span>{Math.round(scorePercentage)}% Score</span>
          </div>
        </div>
      )}

      {/* Shield icon overlay */}
      <motion.div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-20"
        animate={{
          rotate: [0, 360],
          opacity: [0.1, 0.3, 0.1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <Shield className="h-8 w-8" style={{ color: config.colors.primary }} />
      </motion.div>
    </div>
  );
}