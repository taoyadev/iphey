'use client';
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, RefreshCw, Info, Copy, Check } from 'lucide-react';
import { useTranslations } from '@/lib/translations';
import type { FingerprintPayload } from '@/types/report';

interface FingerprintMethod {
  id: string;
  name: string;
  description: string;
  value: string | number;
  hash?: string;
  confidence: number;
  entropy: number;
  details?: Record<string, string | number | boolean | undefined>;
  suspicious?: boolean;
  canRegenerate?: boolean;
}

interface FingerprintExplorerProps {
  fingerprint?: FingerprintPayload;
  onRegenerate?: (method: string) => void;
}

const MethodCard = ({
  method,
  onToggle,
  onRegenerate,
  isVisible,
  t,
}: {
  method: FingerprintMethod;
  onToggle: () => void;
  onRegenerate: () => void;
  isVisible: boolean;
  t: (key: string) => string;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(String(method.value));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return '#01AE7D';
    if (confidence >= 60) return '#FACC15';
    return '#F87171';
  };

  const getEntropyColor = (entropy: number) => {
    if (entropy >= 3.5) return '#F87171'; // High entropy = more identifying
    if (entropy >= 2.5) return '#FACC15';
    return '#01AE7D';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        rounded-xl border transition-all duration-300
        ${method.suspicious ? 'border-red-500/20 bg-red-500/5' : 'border-white/10 bg-white/5'}
        ${isVisible ? 'ring-2 ring-accent/20' : ''}
      `}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-white">{method.name}</h3>
              {method.suspicious && (
                <span className="rounded-full bg-red-500/10 px-2 py-1 text-xs text-red-400">
                  {t('explorer.labels.suspicious')}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mb-2">{method.description}</p>
          </div>
          <button onClick={onToggle} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
            {isVisible ? <EyeOff size={16} className="text-slate-400" /> : <Eye size={16} className="text-slate-400" />}
          </button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="rounded-lg border border-white/5 bg-black/20 p-2">
            <div className="flex items-center gap-2 mb-1">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: getConfidenceColor(method.confidence) }}
              />
              <span className="text-xs text-slate-400">{t('explorer.metrics.confidence')}</span>
            </div>
            <span className="text-sm font-medium text-white">{method.confidence}%</span>
          </div>
          <div className="rounded-lg border border-white/5 bg-black/20 p-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: getEntropyColor(method.entropy) }} />
              <span className="text-xs text-slate-400">{t('explorer.metrics.entropy')}</span>
            </div>
            <span className="text-sm font-medium text-white">{method.entropy.toFixed(1)}</span>
          </div>
        </div>

        {/* Value Display */}
        <div className="rounded-lg border border-white/5 bg-black/20 p-3 font-mono text-sm text-slate-300 break-all mb-3">
          {method.hash || method.value}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {method.canRegenerate && (
            <button
              onClick={onRegenerate}
              className="flex items-center gap-1 rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/20 transition-colors"
            >
              <RefreshCw size={12} />
              {t('explorer.actions.regenerate')}
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 hover:bg-white/20 transition-colors"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? t('explorer.actions.copied') : t('explorer.actions.copy')}
          </button>
          <button className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 hover:bg-white/20 transition-colors">
            <Info size={12} />
            {t('explorer.actions.learnMore')}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isVisible && method.details && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-white/10 overflow-hidden"
          >
            <div className="p-4 space-y-3">
              <h4 className="font-medium text-white text-sm">{t('explorer.labels.technicalDetails')}</h4>
              {Object.entries(method.details).map(([key, value]) => (
                <div key={key} className="grid grid-cols-2 gap-2 text-xs">
                  <span className="text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                  <span className="text-slate-300 font-mono">{String(value)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const FingerprintExplorer = ({ fingerprint, onRegenerate }: FingerprintExplorerProps) => {
  const t = useTranslations('fingerprint');
  const [visibleMethods, setVisibleMethods] = useState<Set<string>>(new Set(['canvas', 'webgl']));

  const fingerprintMethods = useMemo(() => {
    if (!fingerprint) return [];

    const methods: FingerprintMethod[] = [];

    // Canvas Fingerprint
    if (fingerprint.canvas) {
      methods.push({
        id: 'canvas',
        name: t('explorer.methods.canvas.name'),
        description: t('explorer.methods.canvas.description'),
        value: fingerprint.canvas.hash,
        hash: fingerprint.canvas.hash,
        confidence: 95,
        entropy: 4.2,
        suspicious: false, // Could be calculated based on known patterns
        canRegenerate: true,
        details: {
          width: fingerprint.canvas.width,
          height: fingerprint.canvas.height,
          dataURL: fingerprint.canvas.dataURL?.substring(0, 50) + '...',
          renderingTime: fingerprint.canvas.renderingTime,
        },
      });
    }

    // WebGL Fingerprint
    if (fingerprint.webgl) {
      methods.push({
        id: 'webgl',
        name: t('explorer.methods.webgl.name'),
        description: t('explorer.methods.webgl.description'),
        value: fingerprint.webgl.hash,
        hash: fingerprint.webgl.hash,
        confidence: 92,
        entropy: 3.8,
        suspicious: false,
        canRegenerate: true,
        details: {
          vendor: fingerprint.webgl.vendor,
          renderer: fingerprint.webgl.renderer,
          unmaskedVendor: fingerprint.webgl.unmaskedVendor,
          unmaskedRenderer: fingerprint.webgl.unmaskedRenderer,
          maxTextureSize: fingerprint.webgl.maxTextureSize,
          extensions: fingerprint.webgl.extensions?.length || 0,
        },
      });
    }

    // Audio Fingerprint
    if (fingerprint.audio) {
      methods.push({
        id: 'audio',
        name: t('explorer.methods.audio.name'),
        description: t('explorer.methods.audio.description'),
        value: fingerprint.audio.hash,
        hash: fingerprint.audio.hash,
        confidence: 88,
        entropy: 3.5,
        suspicious: false,
        canRegenerate: true,
        details: {
          sampleRate: fingerprint.audio.sampleRate,
          numberOfOutputs: fingerprint.audio.numberOfOutputs,
          channelCount: fingerprint.audio.channelCount,
        },
      });
    }

    // Fonts
    if (fingerprint.fonts) {
      methods.push({
        id: 'fonts',
        name: t('explorer.methods.fonts.name'),
        description: t('explorer.methods.fonts.description'),
        value: fingerprint.fonts.hash,
        hash: fingerprint.fonts.hash,
        confidence: 90,
        entropy: 3.2,
        suspicious: false,
        canRegenerate: false,
        details: {
          detectedFonts: fingerprint.fonts.detected?.length || 0,
          baseFonts: fingerprint.fonts.base?.length || 0,
          totalTested: fingerprint.fonts.totalTested || 0,
          sampleFonts: fingerprint.fonts.detected?.slice(0, 5).join(', ') + '...',
        },
      });
    }

    // Screen Properties
    if (fingerprint.screen) {
      methods.push({
        id: 'screen',
        name: t('explorer.methods.screen.name'),
        description: t('explorer.methods.screen.description'),
        value: `${fingerprint.screen.width}x${fingerprint.screen.height} @${fingerprint.screen.pixelRatio}x`,
        confidence: 85,
        entropy: 2.8,
        suspicious: false,
        canRegenerate: false,
        details: {
          width: fingerprint.screen.width,
          height: fingerprint.screen.height,
          colorDepth: fingerprint.screen.colorDepth,
          pixelRatio: fingerprint.screen.pixelRatio,
          availWidth: fingerprint.screen.availWidth,
          availHeight: fingerprint.screen.availHeight,
        },
      });
    }

    // Client Rects
    if (fingerprint.clientRects) {
      methods.push({
        id: 'clientRects',
        name: t('explorer.methods.clientRects.name'),
        description: t('explorer.methods.clientRects.description'),
        value: fingerprint.clientRects.hash,
        hash: fingerprint.clientRects.hash,
        confidence: 82,
        entropy: 3.0,
        suspicious: false,
        canRegenerate: true,
        details: {
          elementCount: fingerprint.clientRects.elementCount,
          totalVariance: fingerprint.clientRects.totalVariance?.toFixed(4),
          averageVariance: fingerprint.clientRects.averageVariance?.toFixed(4),
        },
      });
    }

    return methods.sort((a, b) => b.confidence - a.confidence);
  }, [fingerprint, t]);

  const toggleVisibility = (methodId: string) => {
    setVisibleMethods(prev => {
      const next = new Set(prev);
      if (next.has(methodId)) {
        next.delete(methodId);
      } else {
        next.add(methodId);
      }
      return next;
    });
  };

  const overallEntropy = useMemo(() => {
    if (!fingerprintMethods.length) return 0;
    return fingerprintMethods.reduce((sum, m) => sum + m.entropy, 0) / fingerprintMethods.length;
  }, [fingerprintMethods]);

  const suspiciousCount = fingerprintMethods.filter(m => m.suspicious).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
        <h2 className="text-2xl font-semibold text-white">{t('explorer.title')}</h2>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="text-2xl font-bold text-accent mb-1">{overallEntropy.toFixed(1)}</div>
            <div className="text-xs text-slate-400">{t('explorer.metrics.averageEntropy')}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className={`text-2xl font-bold mb-1 ${suspiciousCount > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {suspiciousCount}
            </div>
            <div className="text-xs text-slate-400">{t('explorer.metrics.suspiciousSignals')}</div>
          </div>
        </div>

        <p className="text-sm text-slate-400">{t('explorer.instructions')}</p>
      </motion.div>

      {/* Methods Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {fingerprintMethods.map(method => (
          <MethodCard
            key={method.id}
            method={method}
            isVisible={visibleMethods.has(method.id)}
            onToggle={() => toggleVisibility(method.id)}
            onRegenerate={() => onRegenerate?.(method.id)}
            t={t}
          />
        ))}
      </div>

      {/* Educational Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="rounded-xl border border-accent/20 bg-accent/5 p-6"
      >
        <h3 className="font-semibold text-accent mb-3">{t('explorer.education.title')}</h3>
        <div className="space-y-2 text-sm text-slate-300">
          <p>{t('explorer.education.entropyDesc')}</p>
          <p>{t('explorer.education.confidenceDesc')}</p>
          <p>{t('explorer.education.suspiciousDesc')}</p>
        </div>
      </motion.div>
    </div>
  );
};
