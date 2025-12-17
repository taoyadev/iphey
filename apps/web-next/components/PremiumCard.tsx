'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { cn } from '@/lib/utils';

interface PremiumCardProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
  hover?: boolean;
  glass?: boolean;
  gradient?: boolean;
  delay?: number;
  icon?: React.ReactNode;
}

export function PremiumCard({
  children,
  title,
  description,
  className,
  hover = true,
  glass = false,
  gradient = false,
  delay = 0,
  icon,
}: PremiumCardProps) {
  const baseClasses = cn(
    'relative overflow-hidden rounded-2xl transition-all duration-300',
    glass && 'glass-card border',
    !glass && 'bg-card border border-border hover:border-primary/20',
    hover && 'hover:shadow-lg hover:-translate-y-1',
    gradient && 'bg-gradient-to-br from-primary/5 to-accent/5'
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      whileHover={hover ? { scale: 1.02 } : {}}
      className={baseClasses}
    >
      {/* Subtle gradient overlay */}
      {gradient && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-50" />
      )}

      {/* Shimmer effect */}
      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500">
        <div className="shimmer absolute inset-0" />
      </div>

      <Card className={cn('relative z-10 border-0 shadow-none bg-transparent', className)}>
        {(title || icon) && (
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              {icon && (
                <div className="h-12 w-12 rounded-xl glass-panel flex items-center justify-center text-primary">
                  {icon}
                </div>
              )}
              <div className="flex-1">
                {title && (
                  <CardTitle className="text-xl font-bold text-foreground mb-1">
                    {title}
                  </CardTitle>
                )}
                {description && (
                  <p className="text-sm text-muted-foreground">{description}</p>
                )}
              </div>
            </div>
          </CardHeader>
        )}
        <CardContent className="pt-0">{children}</CardContent>
      </Card>
    </motion.div>
  );
}

export function PremiumPanel({
  children,
  title,
  description,
  className,
  glass = true,
  delay = 0,
}: Omit<PremiumCardProps, 'icon' | 'hover' | 'gradient'>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className={cn(
        'glass-panel rounded-2xl p-6 border',
        glass && 'shadow-lg',
        className
      )}
    >
      {title && (
        <div className="flex items-center gap-3 mb-6">
          <h3 className="text-xl font-bold text-foreground">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground ml-auto">{description}</p>
          )}
        </div>
      )}
      {children}
    </motion.div>
  );
}