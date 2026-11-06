'use client';

import { HistoryTracker } from '@/components/HistoryTracker';
import type { HomeHistoryProps } from '@/components/home/types';

export default function HistorySection({ reportData, onSaveRecord }: HomeHistoryProps) {
  return <HistoryTracker currentReport={reportData ?? undefined} onSaveRecord={onSaveRecord} />;
}
