'use client';

import { Skeleton, SkeletonCard } from './Skeleton';

/**
 * Skeleton loader for the main verdict section
 */
export const VerdictSkeleton = () => (
  <div className="space-y-6">
    <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
      <div className="space-y-4 max-w-2xl flex-1">
        <Skeleton variant="text" width="60%" height={40} className="mb-2" />
        <Skeleton variant="rounded" width="150px" height={32} className="mb-4" />
        <Skeleton variant="text" width="90%" />
        <Skeleton variant="text" width="80%" />
        <div className="flex flex-wrap gap-4 mt-6">
          <Skeleton variant="rounded" width="140px" height={40} />
          <Skeleton variant="rounded" width="180px" height={40} />
        </div>
      </div>
      <div className="hidden lg:block">
        <Skeleton variant="circular" width={200} height={200} />
      </div>
    </div>

    {/* Info cards skeleton */}
    <div className="mt-8 grid gap-4 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-white/5 bg-black/20 p-4 space-y-2">
          <Skeleton variant="text" width="40%" height={12} />
          <Skeleton variant="text" width="60%" height={24} />
          <Skeleton variant="text" width="50%" height={12} />
        </div>
      ))}
    </div>
  </div>
);

/**
 * Skeleton loader for panel cards grid
 */
export const PanelCardsSkeleton = () => (
  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="rounded-2xl border border-white/5 bg-surface/60 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton variant="circular" width={40} height={40} />
          <Skeleton variant="text" width="30%" />
        </div>
        <Skeleton variant="text" width="70%" />
        <Skeleton variant="text" width="90%" />
        <Skeleton variant="text" width="60%" />
        <div className="pt-3">
          <Skeleton variant="rounded" width="100%" height={36} />
        </div>
      </div>
    ))}
  </div>
);

/**
 * Skeleton loader for radar chart
 */
export const RadarChartSkeleton = () => (
  <div className="flex items-center justify-center py-12">
    <div className="relative">
      <Skeleton variant="circular" width={400} height={400} />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center space-y-2">
          <Skeleton variant="text" width={200} />
          <Skeleton variant="text" width={150} />
        </div>
      </div>
    </div>
  </div>
);

/**
 * Skeleton for detailed analysis section
 */
export const AnalysisSkeleton = () => (
  <div className="space-y-6">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="rounded-3xl border border-white/5 bg-surface/60 p-6 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <Skeleton variant="text" width="40%" height={28} />
          <div className="flex gap-4">
            <div className="text-right space-y-1">
              <Skeleton variant="text" width={60} height={32} />
              <Skeleton variant="text" width={40} height={12} />
            </div>
            <div className="text-right space-y-1">
              <Skeleton variant="text" width={50} height={24} />
              <Skeleton variant="text" width={60} height={12} />
            </div>
          </div>
        </div>

        {/* Breakdown skeleton */}
        <div className="space-y-2">
          <Skeleton variant="text" width="30%" height={20} />
          {Array.from({ length: 4 }).map((_, j) => (
            <div key={j} className="flex items-center gap-3">
              <Skeleton variant="text" width={100} height={16} />
              <Skeleton variant="rectangular" className="flex-1" height={8} />
              <Skeleton variant="text" width={30} height={16} />
            </div>
          ))}
        </div>

        {/* Signals skeleton */}
        <div className="space-y-3">
          <Skeleton variant="text" width="30%" height={20} />
          {Array.from({ length: 2 }).map((_, j) => (
            <SkeletonCard key={j} />
          ))}
        </div>
      </div>
    ))}
  </div>
);

/**
 * Full report skeleton combining all sections
 */
export const FullReportSkeleton = () => (
  <div className="space-y-10">
    {/* Verdict section */}
    <div className="rounded-3xl border border-white/5 bg-surface/40 p-8">
      <VerdictSkeleton />
    </div>

    {/* Radar chart section */}
    <div className="rounded-3xl border border-white/5 bg-surface/40 p-8">
      <div className="mb-6 space-y-2">
        <Skeleton variant="text" width="40%" height={28} />
        <Skeleton variant="text" width="60%" height={16} />
      </div>
      <RadarChartSkeleton />
    </div>

    {/* Panel cards section */}
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton variant="text" width="30%" height={32} />
        <Skeleton variant="text" width="40%" height={16} />
      </div>
      <PanelCardsSkeleton />
    </div>
  </div>
);
