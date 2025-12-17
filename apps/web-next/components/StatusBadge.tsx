'use client';

import { ShieldCheck, AlertTriangle, OctagonAlert } from 'lucide-react';
import type { Verdict } from '../types/report';

const STATUS_MAP: Record<Verdict, { label: string; color: string; Icon: typeof ShieldCheck }> = {
  trustworthy: {
    label: 'Trustworthy',
    color: 'text-emerald-300 bg-emerald-500/10 border-emerald-400/30',
    Icon: ShieldCheck,
  },
  suspicious: {
    label: 'Suspicious',
    color: 'text-amber-200 bg-amber-500/10 border-amber-400/30',
    Icon: AlertTriangle,
  },
  unreliable: {
    label: 'Unreliable',
    color: 'text-rose-200 bg-rose-500/10 border-rose-400/30',
    Icon: OctagonAlert,
  },
};

interface Props {
  status: Verdict;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge = ({ status, size = 'md' }: Props) => {
  const { label, color, Icon } = STATUS_MAP[status];
  const padding = size === 'sm' ? 'px-2 py-1 text-xs' : size === 'lg' ? 'px-4 py-2 text-base' : 'px-3 py-1.5 text-sm';

  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 18 : 16;

  return (
    <span className={`inline-flex items-center gap-2 border rounded-full font-medium ${color} ${padding}`}>
      <Icon size={iconSize} strokeWidth={2} />
      {label}
    </span>
  );
};
