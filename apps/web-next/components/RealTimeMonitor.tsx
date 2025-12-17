'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useTranslations } from '@/lib/translations';
import { collectFingerprint } from '@/lib/fingerprint';
import type { FingerprintPayload } from '@/types/report';

interface ParameterChange {
  parameter: string;
  oldValue: unknown;
  newValue: unknown;
  impact: 'high' | 'medium' | 'low';
  category: 'browser' | 'hardware' | 'software' | 'location';
  timestamp: number;
  description: string;
}

interface MonitoringStats {
  totalChanges: number;
  highImpactChanges: number;
  sessionDuration: number;
  mostActiveCategory: string;
  lastUpdate: number;
}

export const RealTimeMonitor = () => {
  const t = useTranslations('monitor');
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [currentFingerprint, setCurrentFingerprint] = useState<FingerprintPayload | null>(null);
  const [previousFingerprint, setPreviousFingerprint] = useState<FingerprintPayload | null>(null);
  const [changes, setChanges] = useState<ParameterChange[]>([]);
  const [stats, setStats] = useState<MonitoringStats>({
    totalChanges: 0,
    highImpactChanges: 0,
    sessionDuration: 0,
    mostActiveCategory: 'browser',
    lastUpdate: Date.now(),
  });
  const [monitoringInterval, setMonitoringInterval] = useState(2000); // 2 seconds
  const [expandedChanges, setExpandedChanges] = useState<Set<number>>(new Set());

  // Calculate fingerprint difference
  const detectChanges = useCallback(
    (oldFp: FingerprintPayload | null, newFp: FingerprintPayload): ParameterChange[] => {
      if (!oldFp || !newFp) return [];

      const detectedChanges: ParameterChange[] = [];
      const timestamp = Date.now();

      // Helper function to add changes
      const addChange = (
        parameter: string,
        oldValue: unknown,
        newValue: unknown,
        impact: 'high' | 'medium' | 'low',
        category: 'browser' | 'hardware' | 'software' | 'location',
        description: string
      ) => {
        detectedChanges.push({
          parameter,
          oldValue,
          newValue,
          impact,
          category,
          timestamp,
          description,
        });
      };

      // Browser changes
      if (oldFp.userAgent !== newFp.userAgent) {
        addChange('User-Agent', oldFp.userAgent, newFp.userAgent, 'high', 'browser', t('userAgentChanged'));
      }

      if (JSON.stringify(oldFp.languages) !== JSON.stringify(newFp.languages)) {
        addChange(
          'Languages',
          oldFp.languages,
          newFp.languages,
          'medium',
          'browser',
          'Browser language preferences changed'
        );
      }

      // Screen changes
      if (oldFp.screen?.width !== newFp.screen?.width || oldFp.screen?.height !== newFp.screen?.height) {
        addChange(
          t('screenResolution'),
          `${oldFp.screen?.width}x${oldFp.screen?.height}`,
          `${newFp.screen?.width}x${newFp.screen?.height}`,
          'medium',
          'hardware',
          t('screenResolutionChanged')
        );
      }

      // Hardware changes
      if (oldFp.hardwareConcurrency !== newFp.hardwareConcurrency) {
        addChange(
          t('cpuCores'),
          oldFp.hardwareConcurrency,
          newFp.hardwareConcurrency,
          'high',
          'hardware',
          t('cpuCoreChanged')
        );
      }

      // Software changes
      if (oldFp.cookiesEnabled !== newFp.cookiesEnabled) {
        addChange(
          'Cookies',
          oldFp.cookiesEnabled ? 'Enabled' : 'Disabled',
          newFp.cookiesEnabled ? 'Enabled' : 'Disabled',
          'high',
          'software',
          t('cookieSettingsChanged')
        );
      }

      // Enhanced fingerprint changes
      if (oldFp.canvas?.hash !== newFp.canvas?.hash) {
        addChange(
          t('canvasFingerprint'),
          oldFp.canvas?.hash?.substring(0, 8) + '...',
          newFp.canvas?.hash?.substring(0, 8) + '...',
          'high',
          'hardware',
          t('canvasFingerprintChanged')
        );
      }

      if (oldFp.webgl?.hash !== newFp.webgl?.hash) {
        addChange(
          t('webglFingerprint'),
          oldFp.webgl?.hash?.substring(0, 8) + '...',
          newFp.webgl?.hash?.substring(0, 8) + '...',
          'high',
          'hardware',
          t('webglFingerprintChanged')
        );
      }

      // Timezone changes
      if (oldFp.timezone !== newFp.timezone) {
        addChange('Timezone', oldFp.timezone, newFp.timezone, 'high', 'location', t('timezoneChanged'));
      }

      return detectedChanges;
    },
    [t]
  );

  // Start monitoring
  const startMonitoring = useCallback(async () => {
    setIsMonitoring(true);
    const initialFingerprint = await collectFingerprint();
    setCurrentFingerprint(initialFingerprint);
    setPreviousFingerprint(initialFingerprint);
  }, []);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  // Monitoring effect
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(async () => {
      try {
        const newFingerprint = await collectFingerprint();
        const detectedChanges = detectChanges(previousFingerprint, newFingerprint);

        if (detectedChanges.length > 0) {
          setChanges(prev => [...detectedChanges, ...prev].slice(0, 50)); // Keep last 50 changes
          setPreviousFingerprint(currentFingerprint);
          setCurrentFingerprint(newFingerprint);

          // Update stats
          setStats(prev => {
            const newTotal = prev.totalChanges + detectedChanges.length;
            const newHighImpact = prev.highImpactChanges + detectedChanges.filter(c => c.impact === 'high').length;

            // Calculate most active category
            const categoryCounts = detectedChanges.reduce(
              (acc, change) => {
                acc[change.category] = (acc[change.category] || 0) + 1;
                return acc;
              },
              {} as Record<string, number>
            );

            const mostActive =
              Object.entries(categoryCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || prev.mostActiveCategory;

            return {
              totalChanges: newTotal,
              highImpactChanges: newHighImpact,
              sessionDuration: Date.now() - (prev.lastUpdate || Date.now()),
              mostActiveCategory: mostActive,
              lastUpdate: Date.now(),
            };
          });
        }
      } catch (error) {
        console.error('Monitoring error:', error);
      }
    }, monitoringInterval);

    return () => clearInterval(interval);
  }, [isMonitoring, previousFingerprint, currentFingerprint, monitoringInterval, detectChanges]);

  // Format duration
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  // Get impact icon and color
  const getImpactStyle = (impact: string) => {
    switch (impact) {
      case 'high':
        return {
          icon: AlertTriangle,
          color: 'text-red-400',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20',
        };
      case 'medium':
        return {
          icon: Info,
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/20',
        };
      case 'low':
        return {
          icon: CheckCircle,
          color: 'text-green-400',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/20',
        };
      default:
        return {
          icon: Info,
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/20',
        };
    }
  };

  // Category colors
  const categoryColors = {
    browser: 'bg-blue-500/20 text-blue-400',
    hardware: 'bg-purple-500/20 text-purple-400',
    software: 'bg-green-500/20 text-green-400',
    location: 'bg-orange-500/20 text-orange-400',
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-white/5 bg-surface/70 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isMonitoring ? 'bg-red-500/20' : 'bg-accent/10'}`}>
              <Activity className={`w-5 h-5 ${isMonitoring ? 'text-red-400 animate-pulse' : 'text-accent'}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Real-Time Parameter Monitor</h3>
              <p className="text-sm text-slate-400">
                {isMonitoring ? t('monitoringChanges') : t('startMonitoringPrompt')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>Interval:</span>
              <select
                value={monitoringInterval}
                onChange={e => setMonitoringInterval(Number(e.target.value))}
                className="bg-white/5 border border-white/10 rounded px-2 py-1 text-white"
                disabled={isMonitoring}
              >
                <option value="1000">1s</option>
                <option value="2000">2s</option>
                <option value="5000">5s</option>
                <option value="10000">10s</option>
              </select>
            </div>

            <button
              onClick={isMonitoring ? stopMonitoring : startMonitoring}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                isMonitoring
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  : 'bg-accent text-slate-900 hover:bg-accent/80'
              }`}
            >
              {isMonitoring ? t('stopMonitoring') : t('startMonitoring')}
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        {isMonitoring && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="grid grid-cols-2 md:grid-cols-5 gap-3"
          >
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-white">{stats.totalChanges}</div>
              <div className="text-xs text-slate-400">Total Changes</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-400">{stats.highImpactChanges}</div>
              <div className="text-xs text-slate-400">High Impact</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-accent">{formatDuration(stats.sessionDuration)}</div>
              <div className="text-xs text-slate-400">Duration</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-white capitalize">{stats.mostActiveCategory}</div>
              <div className="text-xs text-slate-400">Most Active</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-white">{monitoringInterval / 1000}s</div>
              <div className="text-xs text-slate-400">Check Interval</div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Changes Feed */}
      <AnimatePresence>
        {changes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-white">Detected Changes</h4>
              <button
                onClick={() => setChanges([])}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Clear All
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {changes.map((change, index) => {
                const impactStyle = getImpactStyle(change.impact);
                const isExpanded = expandedChanges.has(index);
                const Icon = impactStyle.icon;

                return (
                  <motion.div
                    key={`${change.timestamp}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`
                      rounded-xl border p-4 cursor-pointer transition-all
                      ${impactStyle.bgColor} ${impactStyle.borderColor}
                      hover:border-white/20
                    `}
                    onClick={() => {
                      const newExpanded = new Set(expandedChanges);
                      if (newExpanded.has(index)) {
                        newExpanded.delete(index);
                      } else {
                        newExpanded.add(index);
                      }
                      setExpandedChanges(newExpanded);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <Icon className={`w-4 h-4 mt-0.5 ${impactStyle.color} flex-shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-white text-sm">{change.parameter}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[change.category]}`}>
                              {change.category}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full capitalize ${impactStyle.color} ${impactStyle.bgColor}`}
                            >
                              {change.impact}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mb-2">{change.description}</p>

                          <div className="flex items-center gap-4 text-xs font-mono">
                            <div className="flex items-center gap-1">
                              <span className="text-slate-400">From:</span>
                              <span className="text-red-400 line-through">
                                {typeof change.oldValue === 'object'
                                  ? JSON.stringify(change.oldValue)?.substring(0, 50) + '...'
                                  : String(change.oldValue)?.substring(0, 30)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-slate-400">To:</span>
                              <span className="text-green-400">
                                {typeof change.newValue === 'object'
                                  ? JSON.stringify(change.newValue)?.substring(0, 50) + '...'
                                  : String(change.newValue)?.substring(0, 30)}
                              </span>
                            </div>
                          </div>

                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              className="mt-3 pt-3 border-t border-white/10"
                            >
                              <div className="text-xs text-slate-400 space-y-1">
                                <p>
                                  {t('timestamp')} {new Date(change.timestamp).toLocaleString()}
                                </p>
                                <p>Change ID: #{changes.length - index}</p>
                                <p>
                                  {t('impactLevel')} {change.impact.toUpperCase()}
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Educational Content */}
      {changes.length === 0 && !isMonitoring && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-accent/20 bg-accent/5 p-8 text-center"
        >
          <Activity className="w-12 h-12 text-accent mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Real-Time Monitoring</h3>
          <p className="text-slate-300 mb-6">
            Monitor browser parameter changes in real-time. Detect when your fingerprint changes due to:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="font-medium text-white mb-2">🔒 Privacy Tool Activation</h4>
              <p className="text-sm text-slate-400">
                Detect when VPN, ad blockers, or fingerprint protection tools are enabled/disabled
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="font-medium text-white mb-2">🖥️ System Changes</h4>
              <p className="text-sm text-slate-400">
                Monitor screen resolution, CPU cores, and hardware parameter changes
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="font-medium text-white mb-2">🌐 Browser Configuration</h4>
              <p className="text-sm text-slate-400">Track User-Agent, language, and timezone modifications</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="font-medium text-white mb-2">🎨 Canvas & WebGL</h4>
              <p className="text-sm text-slate-400">
                Detect canvas or WebGL fingerprint changes due to settings or extensions
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
