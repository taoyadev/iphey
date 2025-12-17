'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Monitor, Globe, Network, Cpu, Settings } from 'lucide-react';
import { useTranslations } from '@/lib/translations';
import type { FingerprintPayload } from '@/types/report';
import type { EnhancedIPResponse } from '@/types/report';

interface DetailedFingerprintDataProps {
  fingerprint?: FingerprintPayload;
  enhancedIP?: EnhancedIPResponse;
  reportIP?: string;
}

const DataRow = ({ label, value, mono = false }: { label: string; value?: string | number | null; mono?: boolean }) => (
  <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-b-0">
    <span className="text-sm text-slate-400">{label}</span>
    <span className={`text-sm text-white text-right max-w-[65%] truncate ${mono ? 'font-mono text-xs' : ''}`}>
      {value || '—'}
    </span>
  </div>
);

const SectionHeader = ({ icon: Icon, title }: { icon: React.ElementType; title: string }) => (
  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/10">
    <Icon className="h-4 w-4 text-accent" />
    <h4 className="text-sm font-semibold text-white uppercase tracking-wide">{title}</h4>
  </div>
);

export const DetailedFingerprintData: React.FC<DetailedFingerprintDataProps> = ({
  fingerprint,
  enhancedIP,
  reportIP,
}) => {
  const t = useTranslations('detailedFingerprint');

  if (!fingerprint) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-2">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-accent border-t-transparent"></div>
          <p className="text-sm text-slate-400">{t('loading')}</p>
        </div>
      </div>
    );
  }

  const ipData = enhancedIP?.geolocation;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Browser Information */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-white/5 bg-surface/40 p-4"
        >
          <SectionHeader icon={Monitor} title={t('sections.browser')} />
          <div className="space-y-1">
            <DataRow
              label={t('labels.browser')}
              value={fingerprint.userAgent?.match(/Chrome|Firefox|Safari|Edge|Opera/)?.[0] || 'Unknown'}
            />
            <DataRow
              label={t('labels.browserVersion')}
              value={fingerprint.userAgent?.match(/Chrome\/(\d+)/)?.[1] || '—'}
            />
            <DataRow label={t('labels.platform')} value={fingerprint.platform} />
            <DataRow label={t('labels.userAgent')} value={fingerprint.userAgent} mono />
            <DataRow label={t('labels.languages')} value={fingerprint.languages?.join(', ')} />
            <DataRow label={t('labels.acceptLanguage')} value={fingerprint.acceptLanguage} />
          </div>
        </motion.div>

        {/* Location Information */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-xl border border-white/5 bg-surface/40 p-4"
        >
          <SectionHeader icon={Globe} title={t('sections.location')} />
          <div className="space-y-1">
            <DataRow
              label={t('labels.country')}
              value={ipData?.country ? `${ipData.country} (${ipData.country})` : '—'}
            />
            <DataRow label={t('labels.continent')} value={ipData?.region || '—'} />
            <DataRow label={t('labels.city')} value={ipData?.city} />
            <DataRow label={t('labels.region')} value={ipData?.region} />
            <DataRow label={t('labels.postalCode')} value={ipData?.postal} />
            <DataRow label={t('labels.latitude')} value={ipData?.latitude?.toString()} />
            <DataRow label={t('labels.longitude')} value={ipData?.longitude?.toString()} />
            <DataRow label={t('labels.timezone')} value={ipData?.timezone || fingerprint.timezone} />
          </div>
        </motion.div>

        {/* IP Address Information */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-white/5 bg-surface/40 p-4"
        >
          <SectionHeader icon={Network} title={t('sections.ipAddress')} />
          <div className="space-y-1">
            <DataRow label={t('labels.ip')} value={reportIP || ipData?.ip || '—'} mono />
            <DataRow label={t('labels.asNumber')} value={ipData?.asn?.toString()} />
            <DataRow label={t('labels.organization')} value={ipData?.org} />
            <DataRow label={t('labels.security')} value={t('labels.allClear')} />
            <DataRow label="WebRTC" value={fingerprint.webrtc?.localIP || '—'} mono />
            <DataRow label="WebRTC STUN" value={fingerprint.webrtc?.publicIP || '—'} mono />
          </div>
        </motion.div>

        {/* Hardware Information */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-xl border border-white/5 bg-surface/40 p-4"
        >
          <SectionHeader icon={Cpu} title={t('sections.hardware')} />
          <div className="space-y-1">
            <DataRow label="WebGL" value={fingerprint.webgl?.hash} mono />
            <DataRow label="Canvas" value={fingerprint.canvas?.hash} mono />
            <DataRow label="Audio" value={fingerprint.audio?.hash} mono />
            <DataRow label="Client Rects" value={fingerprint.clientRects?.hash} mono />
            <DataRow label={t('labels.cpuCores')} value={fingerprint.hardwareConcurrency?.toString()} />
            <DataRow
              label={t('labels.deviceMemory')}
              value={fingerprint.deviceMemory ? `${fingerprint.deviceMemory} GB` : '—'}
            />
            <DataRow
              label={t('labels.screenResolution')}
              value={`${fingerprint.screen?.width}x${fingerprint.screen?.height}`}
            />
            <DataRow label={t('labels.colorDepth')} value={`${fingerprint.screen?.colorDepth}-bit`} />
          </div>
        </motion.div>

        {/* Software Information */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-white/5 bg-surface/40 p-4 lg:col-span-2"
        >
          <SectionHeader icon={Settings} title={t('sections.software')} />
          <div className="grid gap-x-8 md:grid-cols-2">
            <div className="space-y-1">
              <DataRow label={t('labels.timezone')} value={fingerprint.timezone} />
              <DataRow
                label={t('labels.ipTime')}
                value={ipData?.timezone ? new Date().toLocaleString('en-US', { timeZone: ipData.timezone }) : '—'}
              />
              <DataRow
                label={t('labels.systemTime')}
                value={new Date(fingerprint.systemTime || Date.now()).toUTCString()}
              />
              <DataRow label={t('labels.languages')} value={fingerprint.languages?.join(', ')} />
            </div>
            <div className="space-y-1">
              <DataRow label="Flash" value={fingerprint.flashEnabled ? t('labels.enabled') : t('labels.disabled')} />
              <DataRow label="ActiveX" value={t('labels.disabled')} />
              <DataRow label="Java" value={fingerprint.javaEnabled ? t('labels.enabled') : t('labels.disabled')} />
              <DataRow
                label="Cookies"
                value={fingerprint.cookiesEnabled ? t('labels.enabled') : t('labels.disabled')}
              />
              <DataRow label={t('labels.fonts')} value={fingerprint.fonts?.hash || t('labels.loading')} mono />
              <DataRow
                label={t('labels.fontsList')}
                value={`${fingerprint.fonts?.detected?.length || 0} fonts detected`}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
