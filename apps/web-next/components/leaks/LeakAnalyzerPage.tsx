'use client';

import { useTranslations } from '@/lib/translations';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Shield, Globe, Monitor, Cpu, Settings, MapPin, Clock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { collectFingerprint } from '@/lib/fingerprint';
import type { FingerprintPayload, ReportResponse } from '@/types/report';
import { PageLayout } from '@/components/Layout/PageLayout';
import { Section } from '@/components/Layout/Section';
import { PanelCard } from '@/components/PanelCard';
import { StatusBadge } from '@/components/StatusBadge';
import { fetchClientEnhancedIP } from '@/lib/api';
import { LocationMap } from '@/components/LocationMap';

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });

const loadReport = async () => {
  const fingerprint = await collectFingerprint();
  const response = await fetch('/api/v1/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fingerprint }),
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  const data = (await response.json()) as ReportResponse;
  return { data, fingerprint };
};

const LeaksContent = () => {
  const t = useTranslations('leaks');
  const fingerprintRef = useRef<FingerprintPayload>(null);
  const isClient = typeof window !== 'undefined';

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['leaks-report'],
    queryFn: async () => {
      const payload = await loadReport();
      fingerprintRef.current = payload.fingerprint;
      return payload.data;
    },
    enabled: isClient,
  });

  const { data: enhancedIPData } = useQuery({
    queryKey: ['leaks-ip'],
    queryFn: () => fetchClientEnhancedIP({ includeThreat: true, includeASN: true }),
    staleTime: 5 * 60 * 1000,
    enabled: isClient,
  });

  if (!isClient || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent"></div>
          <p className="text-sm text-slate-400">{t('analyzingIdentity')}</p>
        </div>
      </div>
    );
  }

  const verdict = reportData?.verdict || 'trustworthy';
  const panels = reportData?.panels;
  const fingerprint = fingerprintRef.current;
  const ipData = enhancedIPData?.geolocation;

  return (
    <PageLayout>
      {/* Hero Section - Identity Status */}
      <Section className="text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-surface border border-white/10">
            {verdict === 'unreliable' && <AlertTriangle className="h-8 w-8 text-rose-500" />}
            {verdict === 'suspicious' && <Shield className="h-8 w-8 text-yellow-500" />}
            {verdict === 'trustworthy' && <Shield className="h-8 w-8 text-emerald-500" />}
            <div className="text-left">
              <p className="text-sm text-slate-400">{t('identityStatus')}</p>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                {t('looksLike')}
                <StatusBadge status={verdict} size="lg" />
              </h1>
            </div>
          </div>

          <p className="text-slate-300 max-w-2xl mx-auto">{t('subtitle')}</p>
        </motion.div>
      </Section>

      {/* Location & Visit Info */}
      <Section>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Map */}
          {ipData?.latitude && ipData?.longitude && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-white/5 bg-surface/40 p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-accent" />
                <h3 className="text-lg font-semibold text-white">{t('locationMap')}</h3>
              </div>
              <LocationMap
                latitude={ipData.latitude}
                longitude={ipData.longitude}
                city={ipData.city}
                country={ipData.country}
                className="h-64 w-full rounded-xl"
              />
              <div className="mt-4 text-sm text-slate-300">
                <p>
                  {ipData.city}, {ipData.country}
                </p>
                <p className="text-xs text-slate-500">
                  {ipData.latitude?.toFixed(5)}, {ipData.longitude?.toFixed(5)}
                </p>
              </div>
            </motion.div>
          )}

          {/* Visit Stats */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-white/5 bg-surface/40 p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <Clock className="h-5 w-5 text-accent" />
              <h3 className="text-lg font-semibold text-white">{t('visitInfo')}</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <span className="text-sm text-slate-400">{t('timestamp')}</span>
                <span className="text-sm font-mono text-white">
                  {new Date().toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <span className="text-sm text-slate-400">{t('status')}</span>
                <span className="text-sm font-medium text-emerald-500">{t('firstVisit')}</span>
              </div>
              {ipData && (
                <>
                  <div className="flex items-center justify-between py-3 border-b border-white/5">
                    <span className="text-sm text-slate-400">{t('location')}</span>
                    <span className="text-sm text-white">
                      {ipData.city}, {ipData.country}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-white/5">
                    <span className="text-sm text-slate-400">{t('ipAddress')}</span>
                    <span className="text-sm font-mono text-white">{reportData?.ip || ipData.ip || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-sm text-slate-400">{t('personalId')}</span>
                    <span className="text-xs font-mono text-slate-500">
                      {fingerprint?.canvas?.hash?.substring(0, 32) || '—'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </Section>

      {/* Leak Detection Panels */}
      <Section icon={Shield} title={t('leakCategories')} subtitle={t('leakCategoriesSubtitle')}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {panels &&
            Object.entries(panels).map(([key, panel], index) => {
              const icons: Record<string, LucideIcon> = {
                browser: Monitor,
                location: Globe,
                ipAddress: MapPin,
                hardware: Cpu,
                software: Settings,
              };
              const Icon = icons[key] || Shield;

              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <PanelCard
                    title={t(`categories.${key}.title`)}
                    icon={<Icon className="h-5 w-5" />}
                    score={panel.score}
                    status={panel.status}
                    insights={panel.insights}
                    active={false}
                  />
                </motion.div>
              );
            })}
        </div>
      </Section>

      {/* Detailed Fingerprint Parameters */}
      {fingerprint && (
        <Section icon={Settings} title={t('detailedParameters')} subtitle={t('detailedParametersSubtitle')}>
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Browser Details */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl border border-white/5 bg-surface/40 p-6"
            >
              <h4 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
                <Monitor className="h-4 w-4 text-accent" />
                {t('browser')}
              </h4>
              <div className="space-y-2 text-sm">
                <DetailRow label={t('params.userAgent')} value={fingerprint.userAgent} />
                <DetailRow label={t('params.platform')} value={fingerprint.platform} />
                <DetailRow label={t('params.languages')} value={fingerprint.languages?.join(', ')} />
                <DetailRow label={t('params.timezone')} value={fingerprint.timezone} />
                <DetailRow
                  label={t('params.cookiesEnabled')}
                  value={fingerprint.cookiesEnabled ? 'Enabled' : 'Disabled'}
                />
              </div>
            </motion.div>

            {/* Hardware Fingerprints */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.05 }}
              className="rounded-2xl border border-white/5 bg-surface/40 p-6"
            >
              <h4 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
                <Cpu className="h-4 w-4 text-accent" />
                {t('hardware')}
              </h4>
              <div className="space-y-2 text-sm">
                <DetailRow label="WebGL" value={fingerprint.webgl?.hash || '—'} mono />
                <DetailRow label="Canvas" value={fingerprint.canvas?.hash || '—'} mono />
                <DetailRow label="Audio" value={fingerprint.audio?.hash || '—'} mono />
                <DetailRow label="Client Rects" value={fingerprint.clientRects?.hash || '—'} mono />
                <DetailRow
                  label={t('params.hardwareConcurrency')}
                  value={fingerprint.hardwareConcurrency?.toString()}
                />
              </div>
            </motion.div>

            {/* IP & Location */}
            {ipData && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl border border-white/5 bg-surface/40 p-6"
              >
                <h4 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-accent" />
                  {t('ipLocation')}
                </h4>
                <div className="space-y-2 text-sm">
                  <DetailRow label={t('params.ip')} value={reportData?.ip || ipData.ip} mono />
                  <DetailRow label={t('params.country')} value={ipData.country} />
                  <DetailRow label={t('params.city')} value={ipData.city} />
                  <DetailRow label={t('params.region')} value={ipData.region} />
                  <DetailRow label={t('params.postal')} value={ipData.postal} />
                  <DetailRow label="ASN" value={ipData.asn?.toString()} />
                  <DetailRow label={t('params.organization')} value={ipData.org} />
                </div>
              </motion.div>
            )}

            {/* Software & System */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="rounded-2xl border border-white/5 bg-surface/40 p-6"
            >
              <h4 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
                <Settings className="h-4 w-4 text-accent" />
                {t('software')}
              </h4>
              <div className="space-y-2 text-sm">
                <DetailRow label={t('params.timezone')} value={fingerprint.timezone} />
                <DetailRow
                  label={t('params.systemTime')}
                  value={new Date(fingerprint.systemTime || Date.now()).toUTCString()}
                />
                <DetailRow
                  label={t('params.screenResolution')}
                  value={`${fingerprint.screen?.width}x${fingerprint.screen?.height}`}
                />
                <DetailRow label={t('params.colorDepth')} value={`${fingerprint.screen?.colorDepth}-bit`} />
                <DetailRow label={t('params.pixelRatio')} value={fingerprint.screen?.pixelRatio?.toString()} />
                {fingerprint.fonts && (
                  <DetailRow
                    label={t('params.fontsDetected')}
                    value={`${fingerprint.fonts.detected?.length || 0} fonts`}
                  />
                )}
              </div>
            </motion.div>
          </div>
        </Section>
      )}

      {/* How is this determined */}
      <Section>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl border border-accent/20 bg-accent/5 p-6"
        >
          <h4 className="font-semibold text-accent mb-3 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t('howDetermined.title')}
          </h4>
          <p className="text-sm text-slate-300">{t('howDetermined.description')}</p>
        </motion.div>
      </Section>
    </PageLayout>
  );
};

// Helper component for detail rows
const DetailRow = ({ label, value, mono = false }: { label: string; value?: string | null; mono?: boolean }) => (
  <div className="flex items-center justify-between py-2 border-b border-white/5">
    <span className="text-slate-400">{label}</span>
    <span className={`text-white text-right max-w-[60%] truncate ${mono ? 'font-mono text-xs' : ''}`}>
      {value || '—'}
    </span>
  </div>
);

// Main page component
export default function LeaksPage() {
  const [client] = useState(createQueryClient);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent"></div>
          <p className="text-sm text-slate-400">Loading identity analysis…</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={client}>
      <LeaksContent />
    </QueryClientProvider>
  );
}
