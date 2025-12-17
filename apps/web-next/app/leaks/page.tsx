'use client';

import dynamic from 'next/dynamic';

const LeakAnalyzerPage = dynamic(() => import('@/components/leaks/LeakAnalyzerPage'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent"></div>
        <p className="text-sm text-slate-400">Preparing leak analysis…</p>
      </div>
    </div>
  ),
});

export default function LeaksPage() {
  return <LeakAnalyzerPage />;
}
