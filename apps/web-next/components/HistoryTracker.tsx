'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, TrendingUp, TrendingDown, BarChart3, Download, Trash2, Eye, Filter } from 'lucide-react';
import { LineChart, BarChart } from '@tremor/react';
import { useTranslations } from '@/lib/translations';
import type { ReportResponse, PanelKey } from '@/types/report';

interface HistoricalRecord {
  id: string;
  timestamp: number;
  verdict: 'trustworthy' | 'suspicious' | 'unreliable';
  score: number;
  panels: {
    browser: { score: number; status: string };
    location: { score: number; status: string };
    ipAddress: { score: number; status: string };
    hardware: { score: number; status: string };
    software: { score: number; status: string };
  };
  sessionInfo: {
    duration: number;
    browserInfo: string;
    platform: string;
    screenResolution: string;
  };
  metadata?: {
    userAgent: string;
    ip?: string;
    source: string;
    tags?: string[];
  };
}

interface HistoryTrackerProps {
  currentReport?: ReportResponse;
  onSaveRecord?: (record: HistoricalRecord) => void;
}

const STATUS_COLORS = {
  trustworthy: '#01AE7D',
  suspicious: '#FACC15',
  unreliable: '#F87171',
};

const PANEL_KEYS: PanelKey[] = ['browser', 'location', 'ipAddress', 'hardware', 'software'];

export const HistoryTracker = ({ currentReport, onSaveRecord }: HistoryTrackerProps) => {
  const t = useTranslations('history');
  const tPanels = useTranslations('home.panels');

  // Get panel names with translations
  const getPanelName = (panelKey: PanelKey): string => {
    return tPanels(`${panelKey}.title`);
  };
  const [records, setRecords] = useState<HistoricalRecord[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [selectedPanel, setSelectedPanel] = useState<PanelKey | 'all'>('all');
  const [showDetails, setShowDetails] = useState<Set<string>>(new Set());
  const [filterTag, setFilterTag] = useState<string>('');

  // Load records from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('iphey-history');
      if (stored) {
        const parsed = JSON.parse(stored);
        setRecords(parsed.sort((a: HistoricalRecord, b: HistoricalRecord) => b.timestamp - a.timestamp));
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  }, []);

  // Save current report
  const saveCurrentRecord = () => {
    if (!currentReport) return;

    const record: HistoricalRecord = {
      id: `record-${Date.now()}`,
      timestamp: Date.now(),
      verdict: currentReport.verdict,
      score: currentReport.score,
      panels: currentReport.panels,
      sessionInfo: {
        duration: 0, // Would be calculated from actual session start
        browserInfo: navigator.userAgent.split(' ')[0],
        platform: navigator.platform,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
      },
      metadata: {
        userAgent: navigator.userAgent,
        ip: currentReport.ip,
        source: currentReport.source,
        tags: ['manual-save'],
      },
    };

    const updatedRecords = [record, ...records];
    setRecords(updatedRecords);

    try {
      localStorage.setItem('iphey-history', JSON.stringify(updatedRecords));
      onSaveRecord?.(record);
    } catch (error) {
      console.error('Failed to save history:', error);
    }
  };

  // Delete record
  const deleteRecord = (id: string) => {
    const updatedRecords = records.filter(r => r.id !== id);
    setRecords(updatedRecords);

    try {
      localStorage.setItem('iphey-history', JSON.stringify(updatedRecords));
    } catch (error) {
      console.error('Failed to delete record:', error);
    }
  };

  // Clear all history
  const clearHistory = () => {
    if (confirm(t('clearConfirm'))) {
      setRecords([]);
      localStorage.removeItem('iphey-history');
    }
  };

  // Filter records based on period
  const filteredRecords = useMemo(() => {
    let filtered = [...records];

    // Time period filter
    const now = Date.now();
    const periods = {
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
      all: Infinity,
    };

    filtered = filtered.filter(r => now - r.timestamp <= periods[selectedPeriod]);

    // Tag filter
    if (filterTag) {
      filtered = filtered.filter(r =>
        r.metadata?.tags?.some(tag => tag.toLowerCase().includes(filterTag.toLowerCase()))
      );
    }

    return filtered;
  }, [records, selectedPeriod, filterTag]);

  // Prepare chart data
  const chartData = useMemo(() => {
    return filteredRecords
      .map(record => ({
        date: new Date(record.timestamp).toLocaleDateString(),
        time: new Date(record.timestamp).toLocaleTimeString(),
        timestamp: record.timestamp,
        overall: record.score,
        browser: record.panels.browser.score,
        location: record.panels.location.score,
        ipAddress: record.panels.ipAddress.score,
        hardware: record.panels.hardware.score,
        software: record.panels.software.score,
        verdict: record.verdict,
      }))
      .reverse();
  }, [filteredRecords]);

  // Calculate statistics
  const statistics = useMemo(() => {
    if (filteredRecords.length === 0) return null;

    const scores = filteredRecords.map(r => r.score);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    const trend = scores.length > 1 ? scores[scores.length - 1] - scores[0] : 0;

    const verdictCounts = filteredRecords.reduce(
      (acc, r) => {
        acc[r.verdict] = (acc[r.verdict] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalScans: filteredRecords.length,
      averageScore: Math.round(avgScore),
      maxScore,
      minScore,
      trend,
      verdictCounts,
      timeSpan:
        filteredRecords.length > 1
          ? Math.round(
              (filteredRecords[0].timestamp - filteredRecords[filteredRecords.length - 1].timestamp) /
                (24 * 60 * 60 * 1000)
            )
          : 0,
    };
  }, [filteredRecords]);

  // Export history
  const exportHistory = () => {
    const dataStr = JSON.stringify(filteredRecords, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `iphey-history-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Toggle details
  const toggleDetails = (id: string) => {
    const next = new Set(showDetails);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setShowDetails(next);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-white/5 bg-surface/70 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-accent" />
            <h3 className="text-xl font-semibold text-white">{t('title')}</h3>
          </div>

          <div className="flex items-center gap-3">
            {currentReport && (
              <button
                onClick={saveCurrentRecord}
                className="px-4 py-2 bg-accent rounded-lg font-medium text-slate-900 hover:bg-accent/80 transition-all"
              >
                {t('saveCurrentScan')}
              </button>
            )}
            <button
              onClick={exportHistory}
              disabled={filteredRecords.length === 0}
              className="px-4 py-2 bg-white/10 rounded-lg font-medium text-white hover:bg-white/20 transition-all disabled:opacity-50"
            >
              <Download size={16} className="inline mr-2" />
              {t('export')}
            </button>
            <button
              onClick={clearHistory}
              disabled={filteredRecords.length === 0}
              className="px-4 py-2 bg-red-500/10 rounded-lg font-medium text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50"
            >
              <Trash2 size={16} className="inline mr-2" />
              {t('clear')}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">{t('period')}</span>
            {(['7d', '30d', '90d', 'all'] as const).map(period => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                  selectedPeriod === period
                    ? 'bg-accent text-slate-900'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                {period === 'all' ? t('allTime') : t(`last${period}` as 'last7d' | 'last30d' | 'last90d')}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            <input
              type="text"
              placeholder={t('filterByTag')}
              value={filterTag}
              onChange={e => setFilterTag(e.target.value)}
              className="px-3 py-1 bg-white/10 border border-white/10 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-accent"
            />
          </div>
        </div>
      </motion.div>

      {/* Statistics */}
      {statistics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
        >
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">{statistics.totalScans}</div>
            <div className="text-xs text-slate-400">{t('totalScans')}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-accent">{statistics.averageScore}</div>
            <div className="text-xs text-slate-400">{t('averageScore')}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{statistics.maxScore}</div>
            <div className="text-xs text-slate-400">{t('bestScore')}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-400">{statistics.minScore}</div>
            <div className="text-xs text-slate-400">{t('lowestScore')}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              {statistics.trend > 0 ? (
                <TrendingUp className="w-5 h-5 text-green-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-400" />
              )}
              <span className={`text-2xl font-bold ${statistics.trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {Math.abs(statistics.trend)}
              </span>
            </div>
            <div className="text-xs text-slate-400">{t('scoreTrend')}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">{statistics?.timeSpan || 0}</div>
            <div className="text-xs text-slate-400">{t('daysTracked')}</div>
          </div>
        </motion.div>
      )}

      {/* Charts */}
      {chartData.length > 0 && statistics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Overall Score Trend */}
          <div className="rounded-3xl border border-white/5 bg-surface/60 p-6">
            <h4 className="text-lg font-semibold text-white mb-4">{t('overallScoreTrend')}</h4>
            <LineChart
              data={chartData}
              index="date"
              categories={['overall']}
              colors={['emerald']}
              valueFormatter={value => `${value}/100`}
              yAxisWidth={50}
              showLegend={true}
              showGridLines={true}
              showAnimation={true}
              className="h-80"
            />
          </div>

          {/* Panel Scores Comparison */}
          <div className="rounded-3xl border border-white/5 bg-surface/60 p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-white">{t('panelPerformance')}</h4>
              <select
                value={selectedPanel}
                onChange={e => setSelectedPanel(e.target.value as PanelKey | 'all')}
                className="px-3 py-1 bg-white/10 border border-white/10 rounded-lg text-sm text-white"
              >
                <option value="all">{t('allPanels')}</option>
                {PANEL_KEYS.map(key => (
                  <option key={key} value={key}>
                    {tPanels(`${key}.title`)}
                  </option>
                ))}
              </select>
            </div>
            <LineChart
              data={chartData}
              index="date"
              categories={
                selectedPanel === 'all' ? ['browser', 'location', 'ipAddress', 'hardware', 'software'] : [selectedPanel]
              }
              colors={selectedPanel === 'all' ? ['blue', 'purple', 'amber', 'emerald', 'red'] : ['emerald']}
              valueFormatter={value => `${value}/100`}
              yAxisWidth={50}
              showLegend={true}
              showGridLines={true}
              showAnimation={true}
              className="h-80"
            />
          </div>

          {/* Verdict Distribution */}
          <div className="rounded-3xl border border-white/5 bg-surface/60 p-6">
            <h4 className="text-lg font-semibold text-white mb-4">{t('verdictDistribution')}</h4>
            <BarChart
              data={Object.entries(statistics.verdictCounts || {}).map(([verdict, count]) => ({
                verdict,
                count,
              }))}
              index="verdict"
              categories={['count']}
              colors={['emerald']}
              valueFormatter={value => `${value} ${t('scans')}`}
              yAxisWidth={50}
              showLegend={false}
              showGridLines={true}
              showAnimation={true}
              className="h-64"
            />
          </div>
        </motion.div>
      )}

      {/* Records List */}
      {filteredRecords.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <h4 className="text-lg font-semibold text-white">{t('historicalRecords')}</h4>
          <div className="space-y-2">
            {filteredRecords.map(record => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="rounded-xl border border-white/5 bg-white/5 p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: STATUS_COLORS[record.verdict] }}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white">
                          {t('score')} {record.score}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full capitalize ${
                            record.verdict === 'trustworthy'
                              ? 'bg-green-500/20 text-green-400'
                              : record.verdict === 'suspicious'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {record.verdict}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(record.timestamp).toLocaleString()} • {record.sessionInfo.browserInfo} on{' '}
                        {record.sessionInfo.platform}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-300">
                        {Object.entries(record.panels).map(([panel, data]) => (
                          <div key={panel} className="flex items-center gap-1">
                            <span className="capitalize">{getPanelName(panel as PanelKey)}:</span>
                            <span
                              className={
                                data.score >= 80
                                  ? 'text-green-400'
                                  : data.score >= 60
                                    ? 'text-yellow-400'
                                    : 'text-red-400'
                              }
                            >
                              {data.score}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {record.metadata?.tags?.map((tag, idx) => (
                      <span key={idx} className="text-xs px-2 py-1 bg-accent/20 text-accent rounded-full">
                        {tag}
                      </span>
                    ))}
                    <button
                      onClick={() => toggleDetails(record.id)}
                      className="p-1 rounded hover:bg-white/10 transition-colors"
                    >
                      <Eye size={16} className="text-slate-400" />
                    </button>
                    <button
                      onClick={() => deleteRecord(record.id)}
                      className="p-1 rounded hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 size={16} className="text-red-400" />
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {showDetails.has(record.id) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-4 pt-4 border-t border-white/10 space-y-3"
                    >
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-slate-400">{t('platform')}</span>
                          <span className="ml-2 text-white">{record.sessionInfo.platform}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">{t('screen')}</span>
                          <span className="ml-2 text-white">{record.sessionInfo.screenResolution}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">{t('ip')}</span>
                          <span className="ml-2 text-white">{record.metadata?.ip || t('notRecorded')}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">{t('source')}</span>
                          <span className="ml-2 text-white capitalize">{record.metadata?.source}</span>
                        </div>
                      </div>
                      {record.metadata?.userAgent && (
                        <div>
                          <span className="text-slate-400 text-xs">{t('userAgent')}</span>
                          <div className="text-xs text-slate-300 font-mono mt-1 break-all">
                            {record.metadata.userAgent}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {filteredRecords.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">{t('noHistoricalData')}</h3>
          <p className="text-slate-400 max-w-md mx-auto">{t('noHistoricalDataDesc')}</p>
        </motion.div>
      )}
    </div>
  );
};
