'use client';

import { PrivacyToolkit } from '@/components/PrivacyToolkit';
import type { HomeToolkitProps } from '@/components/home/types';

export default function ToolkitSection({ reportData, activePanel, onApplyRecommendation }: HomeToolkitProps) {
  return (
    <PrivacyToolkit
      signals={reportData?.enhanced?.[activePanel]?.detailedSignals}
      onApplyRecommendation={onApplyRecommendation}
    />
  );
}
