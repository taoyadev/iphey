'use client';

import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface PremiumButtonProps {
  variant?: 'default' | 'gradient' | 'glass' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  glow?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export function PremiumButton({
  variant = 'default',
  size = 'default',
  children,
  className,
  icon,
  glow = false,
  ...props
}: PremiumButtonProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'gradient':
        return 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white border-0 hover:shadow-lg hover:shadow-emerald-500/25 hover:scale-105';
      case 'glass':
        return 'glass-panel border border-white/10 text-white hover:bg-white/10';
      case 'outline':
        return 'border-2 border-white/20 text-white/80 hover:bg-white/10 hover:text-white';
      default:
        return 'bg-primary text-white hover:bg-primary/90';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-9 px-4 text-sm';
      case 'lg':
        return 'h-12 px-8 text-lg';
      case 'icon':
        return 'h-10 w-10 p-0';
      default:
        return 'h-11 px-6';
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn('relative inline-block', glow && 'hover-glow')}
    >
      {glow && (
        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-lg blur opacity-25 group-hover:opacity-40 transition-opacity" />
      )}
      <Button
        className={cn(
          'relative z-10 transition-all duration-300 rounded-xl font-medium',
          getVariantClasses(),
          getSizeClasses(),
          className
        )}
        size={size}
        {...props}
      >
        <span className="flex items-center gap-2">
          {icon && <span className="h-4 w-4">{icon}</span>}
          {children}
        </span>
      </Button>
    </motion.div>
  );
}