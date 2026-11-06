'use client';

import { FingerprintExplorer } from '@/components/FingerprintExplorer';
import type { HomeFingerprintProps } from '@/components/home/types';

export default function FingerprintSection({ fingerprint, onRegenerate }: HomeFingerprintProps) {
  return <FingerprintExplorer fingerprint={fingerprint ?? undefined} onRegenerate={onRegenerate} />;
}
