'use client';

import { useTranslations } from '@/lib/translations';
import type { FingerprintPayload } from '@/types/report';

interface InsightFieldsProps {
  fingerprint?: FingerprintPayload;
}

const FieldRow = ({ label, value }: { label: string; value?: string | number | boolean }) => (
  <div className="flex flex-col gap-1 rounded-2xl border border-white/5 bg-surface/60 p-4">
    <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
    <p className="text-sm text-white/90 break-words">{value ?? '—'}</p>
  </div>
);

export const InsightFields = ({ fingerprint }: InsightFieldsProps) => {
  const t = useTranslations('fingerprint');
  if (!fingerprint) {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="h-16 rounded-2xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <FieldRow label={t('jsUserAgent')} value={fingerprint.userAgent} />
      <FieldRow label="Languages" value={fingerprint.languages?.join(', ')} />
      <FieldRow label="Timezone" value={fingerprint.timezone} />
      <FieldRow label="Viewport" value={`${fingerprint.screen?.width} x ${fingerprint.screen?.height}`} />
      <FieldRow label={t('webglVendor')} value={fingerprint.webglVendor ?? '—'} />
      <FieldRow label={t('canvasHash')} value={fingerprint.canvasFingerprint?.slice(0, 16)} />
      <FieldRow label={t('fontsDetected')} value={fingerprint.fontCount ?? fingerprint.legacyFonts?.length ?? 0} />
      <FieldRow label={t('cookiesEnabled')} value={fingerprint.cookiesEnabled ? 'Yes' : 'No'} />
    </div>
  );
};
