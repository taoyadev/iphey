'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Network, Globe, Building2, MapPin } from 'lucide-react';
import type { ASNAnalysis } from '@/types/report';
import { Skeleton } from '@/components/LoadingStates/Skeleton';

interface ASNInfoPanelProps {
  data?: ASNAnalysis;
  isLoading?: boolean;
}

const ASNInfoPanelComponent = ({ data, isLoading }: ASNInfoPanelProps) => {
  if (isLoading) {
    return (
      <div className="glass-panel rounded-2xl p-6">
        <div className="space-y-4">
          <Skeleton variant="text" width="40%" height={28} />
          <div className="grid gap-4">
            <Skeleton variant="rectangular" width="100%" height={60} />
            <Skeleton variant="rectangular" width="100%" height={60} />
            <Skeleton variant="rectangular" width="100%" height={60} />
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="glass-panel rounded-2xl p-6 min-h-[200px] flex items-center justify-center">
        <p className="text-sm text-slate-400">No ASN information available</p>
      </div>
    );
  }

  const { asn, info } = data;

  return (
    <motion.div
      className="glass-panel rounded-2xl p-6 border border-white/5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xs uppercase tracking-wider text-slate-400 font-medium mb-3">ASN Information</h3>
        <div className="flex items-center gap-3">
          <motion.div
            className="p-3 rounded-xl bg-blue-500/10 border border-blue-400/30"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <Network className="text-blue-300" size={28} strokeWidth={2} />
          </motion.div>
          <div>
            <p className="text-2xl font-bold text-white">AS{asn}</p>
            <p className="text-sm text-slate-400">Autonomous System Number</p>
          </div>
        </div>
      </div>

      {/* ASN Details */}
      <div className="space-y-3">
        {/* Organization Name */}
        <motion.div
          className="rounded-xl border border-white/5 bg-black/20 p-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-violet-500/10">
              <Building2 className="text-violet-300" size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Organization</p>
              <p className="text-sm font-semibold text-white break-words">{info.org_name || info.name || 'Unknown'}</p>
            </div>
          </div>
        </motion.div>

        {/* Network Name */}
        {info.name && info.name !== info.org_name && (
          <motion.div
            className="rounded-xl border border-white/5 bg-black/20 p-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10">
                <Network className="text-cyan-300" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Network Name</p>
                <p className="text-sm font-semibold text-white break-words">{info.name}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Description */}
        {info.description && (
          <motion.div
            className="rounded-xl border border-white/5 bg-black/20 p-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/10">
                <Globe className="text-indigo-300" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Description</p>
                <p className="text-sm text-slate-300 break-words leading-relaxed">{info.description}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Country */}
        {info.country && (
          <motion.div
            className="rounded-xl border border-white/5 bg-black/20 p-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <MapPin className="text-emerald-300" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Country</p>
                <p className="text-sm font-semibold text-white">{info.country}</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* ASN Badge */}
      <motion.div
        className="mt-6 p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-400/20"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 mb-1">Autonomous System</p>
            <p className="text-lg font-bold text-white">AS{asn}</p>
          </div>
          <div className="px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30">
            <span className="text-xs font-semibold text-blue-200">Active</span>
          </div>
        </div>
      </motion.div>

      {/* Timestamp */}
      <div className="mt-4 pt-4 border-t border-white/5">
        <p className="text-xs text-slate-500 text-center">Last updated: {new Date(data.timestamp).toLocaleString()}</p>
      </div>
    </motion.div>
  );
};

export const ASNInfoPanel = memo(ASNInfoPanelComponent);
