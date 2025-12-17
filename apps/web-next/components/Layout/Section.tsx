'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface SectionProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  variant?: 'elevated' | 'outlined' | 'ghost' | 'flat';
  className?: string;
  id?: string;
}

const variantStyles = {
  elevated: 'bg-surface/70 backdrop-blur-sm border border-white/5 shadow-xl rounded-2xl p-6 md:p-8',
  outlined: 'bg-transparent border border-white/10 rounded-2xl p-6 md:p-8',
  ghost: 'bg-panel/40 backdrop-blur-sm rounded-2xl p-6 md:p-8',
  flat: 'bg-transparent',
};

export const Section = ({
  children,
  title,
  subtitle,
  icon: Icon,
  variant = 'elevated',
  className = '',
  id,
}: SectionProps) => {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`${variantStyles[variant]} ${className}`}
    >
      {(title || subtitle) && (
        <div className="mb-6">
          {title && (
            <div className="flex items-center gap-3 mb-2">
              {Icon && (
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-accent/10 text-accent">
                  <Icon className="h-5 w-5" />
                </div>
              )}
              <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
            </div>
          )}
          {subtitle && <p className="text-sm text-slate-400 leading-relaxed max-w-3xl">{subtitle}</p>}
        </div>
      )}
      {children}
    </motion.section>
  );
};
