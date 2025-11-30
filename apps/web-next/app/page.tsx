'use client';

import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { lazy, Suspense, useCallback, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RefreshCw, ExternalLink, Shield, BarChart3, Eye, Globe, Activity, Cpu, Fingerprint as FingerprintIcon, Lock } from 'lucide-react';
import { collectFingerprint } from '@/lib/fingerprint';
import type { FingerprintPayload, PanelKey, PanelStatus, ReportResponse } from '@/types/report';
import { PageLayout } from '@/components/Layout/PageLayout';
import { Section } from '@/components/Layout/Section';
import { PanelCard } from '@/components/PanelCard';
import { PanelDetail } from '@/components/PanelDetail';
import { ModernScoreDial } from '@/components/ModernScoreDial';
import { StatusBadge } from '@/components/StatusBadge';
import { InsightFields } from '@/components/InsightFields';
import { PremiumCard } from '@/components/PremiumCard';
import { PremiumPanel } from '@/components/PremiumCard';
import { PremiumButton } from '@/components/PremiumButton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { VerdictSkeleton, PanelCardsSkeleton, RadarChartSkeleton } from '@/components/LoadingStates/ReportSkeleton';
import { ServiceStatusBanner } from '@/components/ServiceStatusBanner';
import { RiskAssessmentCard } from '@/components/RiskAssessmentCard';
import { ThreatIntelPanel } from '@/components/ThreatIntelPanel';
import { ASNInfoPanel } from '@/components/ASNInfoPanel';
import { SEOContentSection } from '@/components/SEOContentSection';
import { fetchClientEnhancedIP, fetchServiceStatus } from '@/lib/api';

// Lazy load heavy components
const InteractiveRadarChart = lazy(() =>
  import('@/components/InteractiveRadarChart').then(m => ({ default: m.InteractiveRadarChart }))
);
const FingerprintExplorer = lazy(() =>
  import('@/components/FingerprintExplorer').then(m => ({ default: m.FingerprintExplorer }))
);
const RealTimeMonitor = lazy(() => import('@/components/RealTimeMonitor').then(m => ({ default: m.RealTimeMonitor })));
const PrivacyToolkit = lazy(() => import('@/components/PrivacyToolkit').then(m => ({ default: m.PrivacyToolkit })));
const HistoryTracker = lazy(() => import('@/components/HistoryTracker').then(m => ({ default: m.HistoryTracker })));
const DetailedFingerprintData = lazy(() =>
  import('@/components/DetailedFingerprintData').then(m => ({ default: m.DetailedFingerprintData }))
);

// Panel copy moved to component level to use translations

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Verdict copy moved to component level to use translations

// Loading component for Suspense fallback
const ComponentLoader = ({ message = 'Loading...' }: { message?: string }) => (
  <div className="flex items-center justify-center py-12">
    <div className="text-center space-y-4">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-accent border-t-transparent"></div>
      <p className="text-sm text-muted">{message}</p>
    </div>
  </div>
);

const loadReport = async () => {
  const fingerprint = await collectFingerprint();

  // Check if API is configured
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new Error('⚠️ Backend API Not Configured\n\nThis is a frontend-only demo deployment. To enable full functionality:\n\n1. Deploy the backend API (see /docs/DEPLOYMENT.md)\n2. Set NEXT_PUBLIC_API_URL environment variable in Cloudflare Pages\n3. Redeploy\n\nRepository: https://github.com/7and1/iphey');
  }

  const response = await fetch(`${apiUrl}/api/v1/report`, {
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

const ReportExperience = () => {
  const [activePanel, setActivePanel] = useState<PanelKey>('browser');
  const [activeTab, setActiveTab] = useState<
    'overview' | 'fingerprint' | 'analysis' | 'monitor' | 'toolkit' | 'history' | 'ip-intel'
  >('overview');
  const [showStatusBanner, setShowStatusBanner] = useState(true);
  const fingerprintRef = useRef<FingerprintPayload>();

  // Panel definitions
  const PANEL_COPY: Record<PanelKey, { title: string; description: string }> = {
    browser: { title: 'Browser', description: 'Browser fingerprint and characteristics' },
    location: { title: 'Location', description: 'Geolocation and timezone data' },
    ipAddress: { title: 'IP Address', description: 'IP reputation and network info' },
    hardware: { title: 'Hardware', description: 'Device hardware specifications' },
    software: { title: 'Software', description: 'Operating system and software stack' },
  };

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['report-card'],
    queryFn: async () => {
      const payload = await loadReport();
      fingerprintRef.current = payload.fingerprint;
      return payload.data;
    },
  });

  // IP Intelligence data - fetch ASN by default
  const { data: enhancedIPData, isLoading: isLoadingEnhancedIP } = useQuery({
    queryKey: ['enhanced-ip'],
    queryFn: () => fetchClientEnhancedIP({ includeThreat: true, includeASN: true }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: true, // Always fetch ASN and threat data
  });

  // Service status data
  const { data: serviceStatus, isLoading: isLoadingServiceStatus } = useQuery({
    queryKey: ['service-status'],
    queryFn: fetchServiceStatus,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Memoize event handlers to prevent unnecessary re-renders
  const handlePanelClick = useCallback((panelKey: PanelKey) => {
    setActivePanel(panelKey);
  }, []);

  const handleTabChange = useCallback(
    (tab: 'overview' | 'fingerprint' | 'analysis' | 'monitor' | 'toolkit' | 'history' | 'ip-intel') => {
      setActiveTab(tab);
    },
    []
  );

  const handleSaveRecord = useCallback((_record: unknown) => {
    // TODO: wire up history persistence backend
  }, []);

  const handleApplyRecommendation = useCallback((_recId: string, _solIdx: number) => {
    // TODO: trigger remediation workflow
  }, []);

  const handleRegenerate = useCallback((_method: string) => {
    // TODO: refresh fingerprint capture
  }, []);

  const active = data?.panels[activePanel];
  const verdict = (data?.verdict ?? 'trustworthy') as PanelStatus;
  const statusMessages = {
    trustworthy: "Your identity appears trustworthy",
    suspicious: "Some suspicious patterns detected",
    unreliable: "High-risk identity signals detected"
  };
  const statusText = statusMessages[verdict] || statusMessages.trustworthy;

  if (error && !isFetching && !data) {
    return (
      <div className="mx-auto max-w-3xl text-center space-y-8 slide-up">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="w-20 h-20 mx-auto rounded-full glass-panel flex items-center justify-center text-destructive"
        >
          <RefreshCw className="h-10 w-10" />
        </motion.div>
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-foreground">Failed to Load Report</h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            {(error as Error).message ?? "An unknown error occurred"}
          </p>
        </div>
        <PremiumButton
          onClick={() => refetch()}
          size="lg"
          variant="gradient"
          icon={<RefreshCw className={isFetching ? 'animate-spin' : ''} size={18} />}
          className="mx-auto"
        >
          Try Again
        </PremiumButton>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <Section variant="elevated" icon={Shield} title={"Overview"} id="overview">
        {isLoading && !data ? (
          <VerdictSkeleton />
        ) : (
          <>
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-4 max-w-2xl">
                <h1 className="heading-lg">{"Your Digital Identity"}</h1>
                {data && <StatusBadge status={verdict} />}
                <p className="body-lg max-w-xl">{statusText}</p>
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => refetch()}
                    className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 font-semibold text-slate-900"
                  >
                    <RefreshCw className={isFetching ? 'animate-spin' : ''} size={16} />
                    {"Re-run Analysis"}
                  </button>
                </div>
              </div>
              <div className="hidden lg:block">
                <ModernScoreDial
                  score={data?.score}
                  status={verdict}
                  size="lg"
                  showDetails={true}
                  animateOnMount={true}
                />
              </div>
              <div className="lg:hidden">
                <ModernScoreDial
                  score={data?.score}
                  status={verdict}
                  size="md"
                  showDetails={true}
                  animateOnMount={true}
                />
              </div>
            </div>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              <PremiumCard
                delay={0.1}
                icon={<Globe className="h-6 w-6" />}
                title="IP Address"
                description="Your current IP address and network details"
              >
                <div className="space-y-3">
                  <p className="text-2xl font-mono text-foreground">
                    {data?.ip ? (data.ip === '::1' ? "localhost (IPv6)" : data.ip) : "Detecting..."}
                  </p>
                  {enhancedIPData?.asn_analysis && (
                    <div className="space-y-2">
                      <Separator />
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">ASN</span>
                          <Badge variant="secondary" className="font-mono">
                            AS{enhancedIPData.asn_analysis.asn}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground truncate"
                             title={enhancedIPData.asn_analysis.info.org_name || enhancedIPData.asn_analysis.info.name}>
                          {enhancedIPData.asn_analysis.info.org_name || enhancedIPData.asn_analysis.info.name || 'Unknown'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </PremiumCard>

              <PremiumCard
                delay={0.2}
                icon={<Activity className="h-6 w-6" />}
                title="Fetched At"
                description="When this report was generated"
              >
                <div className="space-y-2">
                  <p className="text-2xl text-foreground">
                    {data ? new Date(data.fetchedAt).toLocaleTimeString() : '—'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {data ? new Date(data.fetchedAt).toDateString() : ''}
                  </p>
                </div>
              </PremiumCard>

              <PremiumCard
                delay={0.3}
                icon={<RefreshCw className="h-6 w-6" />}
                title="Cache Freshness"
                description="Data source and freshness status"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                    <span className="text-lg font-semibold text-foreground">Real-time</span>
                  </div>
                  <Badge variant="outline" className="w-fit">
                    Live data from {enhancedIPData?.sources_used || 'multiple'} sources
                  </Badge>
                </div>
              </PremiumCard>
            </div>
          </>
        )}
      </Section>

      {/* Enhanced Radar Chart Section */}
      <Section
        variant="elevated"
        icon={BarChart3}
        title={"Analysis"}
        subtitle={"Telemetry"}
        id="analysis"
      >
        {isLoading && !data ? (
          <RadarChartSkeleton />
        ) : (
          <Suspense fallback={<RadarChartSkeleton />}>
            <InteractiveRadarChart data={data?.panels} onPanelClick={handlePanelClick} activePanel={activePanel} />
          </Suspense>
        )}
      </Section>

      {/* Service Status Banner */}
      {showStatusBanner && (
        <ServiceStatusBanner
          status={serviceStatus}
          isLoading={isLoadingServiceStatus}
          onDismiss={() => setShowStatusBanner(false)}
        />
      )}

      {/* Tabbed Interface */}
      <Section variant="ghost" id="features">
        <div className="mb-6">
          {/* Tabs with improved mobile UX and accessibility */}
          <div className="relative">
            <div
              role="tablist"
              aria-label="Report sections"
              className="flex gap-2 p-1.5 bg-white/5 rounded-xl overflow-x-auto scrollbar-hide snap-x snap-mandatory"
            >
              <motion.button
                role="tab"
                aria-selected={activeTab === 'overview'}
                aria-controls="overview-panel"
                id="overview-tab"
                tabIndex={activeTab === 'overview' ? 0 : -1}
                onClick={() => handleTabChange('overview')}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap snap-start flex-shrink-0 min-w-[44px] ${
                  activeTab === 'overview'
                    ? 'bg-accent text-slate-900 shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                {"Overview"}
              </motion.button>
              <motion.button
                role="tab"
                aria-selected={activeTab === 'fingerprint'}
                aria-controls="fingerprint-panel"
                id="fingerprint-tab"
                tabIndex={activeTab === 'fingerprint' ? 0 : -1}
                onClick={() => handleTabChange('fingerprint')}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap snap-start flex-shrink-0 min-w-[44px] ${
                  activeTab === 'fingerprint'
                    ? 'bg-accent text-slate-900 shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <span className="hidden sm:inline">{"Fingerprint Explorer"}</span>
                <span className="sm:hidden" aria-label={"Fingerprint Explorer"}>
                  {"Fingerprint"}
                </span>
              </motion.button>
              <motion.button
                role="tab"
                aria-selected={activeTab === 'analysis'}
                aria-controls="analysis-panel"
                id="analysis-tab"
                tabIndex={activeTab === 'analysis' ? 0 : -1}
                onClick={() => handleTabChange('analysis')}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap snap-start flex-shrink-0 min-w-[44px] ${
                  activeTab === 'analysis'
                    ? 'bg-accent text-slate-900 shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <span className="hidden sm:inline">{"Detailed Analysis"}</span>
                <span className="sm:hidden" aria-label={"Detailed Analysis"}>
                  {"Analysis"}
                </span>
              </motion.button>
              <motion.button
                role="tab"
                aria-selected={activeTab === 'monitor'}
                aria-controls="monitor-panel"
                id="monitor-tab"
                tabIndex={activeTab === 'monitor' ? 0 : -1}
                onClick={() => handleTabChange('monitor')}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap snap-start flex-shrink-0 min-w-[44px] ${
                  activeTab === 'monitor'
                    ? 'bg-accent text-slate-900 shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <span className="hidden sm:inline">{"Real-time Monitor"}</span>
                <span className="sm:hidden" aria-label={"Real-time Monitor"}>
                  {"Monitor"}
                </span>
              </motion.button>
              <motion.button
                role="tab"
                aria-selected={activeTab === 'toolkit'}
                aria-controls="toolkit-panel"
                id="toolkit-tab"
                tabIndex={activeTab === 'toolkit' ? 0 : -1}
                onClick={() => handleTabChange('toolkit')}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap snap-start flex-shrink-0 min-w-[44px] ${
                  activeTab === 'toolkit'
                    ? 'bg-accent text-slate-900 shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <span className="hidden sm:inline">{"Privacy Toolkit"}</span>
                <span className="sm:hidden" aria-label={"Privacy Toolkit"}>
                  {"Toolkit"}
                </span>
              </motion.button>
              <motion.button
                role="tab"
                aria-selected={activeTab === 'history'}
                aria-controls="history-panel"
                id="history-tab"
                tabIndex={activeTab === 'history' ? 0 : -1}
                onClick={() => handleTabChange('history')}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap snap-start flex-shrink-0 min-w-[44px] ${
                  activeTab === 'history'
                    ? 'bg-accent text-slate-900 shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                {"History"}
              </motion.button>
              <motion.button
                role="tab"
                aria-selected={activeTab === 'ip-intel'}
                aria-controls="ip-intel-panel"
                id="ip-intel-tab"
                tabIndex={activeTab === 'ip-intel' ? 0 : -1}
                onClick={() => handleTabChange('ip-intel')}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap snap-start flex-shrink-0 min-w-[44px] ${
                  activeTab === 'ip-intel'
                    ? 'bg-accent text-slate-900 shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <span className="hidden sm:inline">{"IP Intelligence"}</span>
                <span className="sm:hidden" aria-label={"IP Intelligence"}>
                  {"IP Intel"}
                </span>
              </motion.button>
            </div>
            {/* Scroll fade indicators */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-surface/80 to-transparent pointer-events-none md:hidden" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-surface/80 to-transparent pointer-events-none md:hidden" />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              role="tabpanel"
              id="overview-panel"
              aria-labelledby="overview-tab"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <h2 className="text-2xl font-semibold text-white">{"Identity Checks"}</h2>
                <p className="text-sm text-slate-400">{"Tap a card to see details"}</p>
              </div>
              {isLoading && !data ? (
                <PanelCardsSkeleton />
              ) : (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  {Object.entries(PANEL_COPY).map(([key, meta]) => (
                    <PanelCard
                      key={key}
                      id={key as PanelKey}
                      title={meta.title}
                      description={meta.description}
                      panel={data?.panels[key as PanelKey]}
                      active={activePanel === key}
                      onSelect={handlePanelClick}
                      isLoading={isLoading}
                    />
                  ))}
                </div>
              )}

              <div className="grid gap-6 lg:grid-cols-[2fr,1fr] mt-8">
                <PanelDetail title={PANEL_COPY[activePanel].title} panel={active} />
                <div className="rounded-3xl border border-white/5 bg-surface/60 p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-white">{"Extended Toolkit"}</h3>
                  <p className="text-sm text-slate-400">{"Access advanced leak detection tools"}</p>
                  <a
                    href="/leaks"
                    className="inline-flex items-center justify-center rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/20"
                  >
                    {"Open Extended Tools"} <ExternalLink size={16} className="ml-2" />
                  </a>
                  <div className="rounded-2xl border border-accent/20 bg-accent/5 p-4 text-xs text-slate-200">
                    <p className="font-semibold text-accent mb-1">{"Pro Tip"}</p>
                    {data?.enhanced &&
                      data.enhanced[activePanel]?.detailedSignals.some(s => s.impact === 'critical') && (
                        <p>{"Critical issues detected - review detailed analysis"}</p>
                      )}
                    {!data?.enhanced ||
                      (!data.enhanced[activePanel]?.detailedSignals.some(s => s.impact === 'critical') && (
                        <p>{"Use different tabs to explore various aspects of your digital identity"}</p>
                      ))}
                  </div>
                </div>
              </div>

              {/* Detailed Fingerprint Data Section */}
              <div className="mt-8">
                <h3 className="text-xl font-semibold text-white mb-4">{"What Websites See About You"}</h3>
                <Suspense fallback={<ComponentLoader message={"Loading fingerprint data..."} />}>
                  <DetailedFingerprintData
                    fingerprint={fingerprintRef.current}
                    enhancedIP={enhancedIPData}
                    reportIP={data?.ip}
                  />
                </Suspense>
              </div>
            </motion.div>
          )}

          {activeTab === 'fingerprint' && (
            <motion.div
              key="fingerprint"
              role="tabpanel"
              id="fingerprint-panel"
              aria-labelledby="fingerprint-tab"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Suspense fallback={<ComponentLoader message={"Loading fingerprint data..."} />}>
                <FingerprintExplorer fingerprint={fingerprintRef.current} onRegenerate={handleRegenerate} />
              </Suspense>
            </motion.div>
          )}

          {activeTab === 'analysis' && (
            <motion.div
              key="analysis"
              role="tabpanel"
              id="analysis-panel"
              aria-labelledby="analysis-tab"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-6">
                {data?.enhanced &&
                  Object.entries(data.enhanced).map(([panel, enhanced]) => {
                    const panelKey = panel as PanelKey;
                    const panelData = data.panels[panelKey];

                    return (
                      <div key={panel} className="rounded-3xl border border-white/5 bg-surface/60 p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-semibold text-white">
                            {PANEL_COPY[panelKey].title} {"Analysis"}
                          </h3>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-2xl font-bold text-white">{panelData.score}</div>
                              <div className="text-xs text-slate-400">{"Score"}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-accent">{enhanced.confidence}%</div>
                              <div className="text-xs text-slate-400">{"Confidence"}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-slate-300">{enhanced.entropy.toFixed(1)}</div>
                              <div className="text-xs text-slate-400">{"Entropy"}</div>
                            </div>
                          </div>
                        </div>

                        {/* Breakdown */}
                        <div className="mb-6">
                          <h4 className="font-medium text-white mb-3">{"Breakdown"}</h4>
                          <div className="space-y-2">
                            {Object.entries(enhanced.breakdown).map(([category, score]) => (
                              <div key={category} className="flex items-center gap-3">
                                <span className="text-sm text-slate-400 capitalize w-24">{category}:</span>
                                <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-accent to-accent/60 transition-all duration-500"
                                    style={{ width: `${Math.max(0, score)}%` }}
                                  />
                                </div>
                                <span className="text-sm text-slate-300 w-10 text-right">{Math.max(0, score)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Detailed Signals */}
                        <div>
                          <h4 className="font-medium text-white mb-3">{"Detailed Signals"}</h4>
                          <div className="space-y-3">
                            {enhanced.detailedSignals.map((signal, index) => (
                              <div
                                key={index}
                                className={`
                                rounded-xl border p-4
                                ${
                                  signal.impact === 'critical'
                                    ? 'border-red-500/20 bg-red-500/5'
                                    : signal.impact === 'high'
                                      ? 'border-orange-500/20 bg-orange-500/5'
                                      : signal.impact === 'medium'
                                        ? 'border-yellow-500/20 bg-yellow-500/5'
                                        : signal.impact === 'low'
                                          ? 'border-blue-500/20 bg-blue-500/5'
                                          : 'border-green-500/20 bg-green-500/5'
                                }
                              `}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`
                                    text-xs px-2 py-1 rounded-full font-medium
                                    ${
                                      signal.impact === 'critical'
                                        ? 'bg-red-500/20 text-red-400'
                                        : signal.impact === 'high'
                                          ? 'bg-orange-500/20 text-orange-400'
                                          : signal.impact === 'medium'
                                            ? 'bg-yellow-500/20 text-yellow-400'
                                            : signal.impact === 'low'
                                              ? 'bg-blue-500/20 text-blue-400'
                                              : 'bg-green-500/20 text-green-400'
                                    }
                                  `}
                                    >
                                      {signal.impact.toUpperCase()}
                                    </span>
                                    <span className="text-sm font-medium text-white">{signal.message}</span>
                                  </div>
                                  {signal.scorePenalty > 0 && (
                                    <span className="text-sm text-red-400">-{signal.scorePenalty}</span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-300 mb-2">{signal.explanation}</p>
                                {signal.recommendation && (
                                  <p className="text-xs text-accent">💡 {signal.recommendation}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </motion.div>
          )}

          {activeTab === 'monitor' && (
            <motion.div
              key="monitor"
              role="tabpanel"
              id="monitor-panel"
              aria-labelledby="monitor-tab"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Suspense fallback={<ComponentLoader message={"Loading real-time monitor..."} />}>
                <RealTimeMonitor />
              </Suspense>
            </motion.div>
          )}

          {activeTab === 'toolkit' && (
            <motion.div
              key="toolkit"
              role="tabpanel"
              id="toolkit-panel"
              aria-labelledby="toolkit-tab"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Suspense fallback={<ComponentLoader message={"Loading privacy toolkit..."} />}>
                <PrivacyToolkit
                  signals={data?.enhanced?.[activePanel]?.detailedSignals}
                  onApplyRecommendation={handleApplyRecommendation}
                />
              </Suspense>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              role="tabpanel"
              id="history-panel"
              aria-labelledby="history-tab"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Suspense fallback={<ComponentLoader message={"Loading history..."} />}>
                <HistoryTracker currentReport={data} onSaveRecord={handleSaveRecord} />
              </Suspense>
            </motion.div>
          )}

          {activeTab === 'ip-intel' && (
            <motion.div
              key="ip-intel"
              role="tabpanel"
              id="ip-intel-panel"
              aria-labelledby="ip-intel-tab"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-6">
                {/* IP Address Display */}
                <div className="rounded-3xl border border-white/5 bg-surface/60 p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-400/30">
                      <Globe className="text-blue-300" size={28} strokeWidth={2} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{"IP Intelligence Analysis"}</h2>
                      <p className="text-sm text-slate-400">{"Comprehensive IP reputation and network analysis"}</p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
                    <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">{"Your IP Address"}</p>
                    <p className="text-2xl text-white font-mono">
                      {isLoadingEnhancedIP ? '...' : (enhancedIPData?.ip ?? data?.ip ?? "Detecting...")}
                    </p>
                    {enhancedIPData?.geolocation && (
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
                        {enhancedIPData.geolocation.city && <span>{enhancedIPData.geolocation.city}</span>}
                        {enhancedIPData.geolocation.region && <span>• {enhancedIPData.geolocation.region}</span>}
                        {enhancedIPData.geolocation.country && <span>• {enhancedIPData.geolocation.country}</span>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Risk Assessment */}
                <RiskAssessmentCard data={enhancedIPData?.risk_assessment} isLoading={isLoadingEnhancedIP} />

                {/* Threat Intelligence and ASN in 2-column grid */}
                <div className="grid gap-6 lg:grid-cols-2">
                  <ThreatIntelPanel data={enhancedIPData?.threats} isLoading={isLoadingEnhancedIP} />
                  <ASNInfoPanel data={enhancedIPData?.asn_analysis} isLoading={isLoadingEnhancedIP} />
                </div>

                {/* Data Sources */}
                {enhancedIPData?.sources_used && enhancedIPData.sources_used.length > 0 && (
                  <div className="rounded-3xl border border-white/5 bg-surface/60 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">{"Data Sources"}</h3>
                    <div className="flex flex-wrap gap-2">
                      {enhancedIPData.sources_used.map((source, index) => (
                        <motion.span
                          key={source}
                          className="px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-200 text-xs font-medium"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          {source}
                        </motion.span>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-4">
                      {"Last Updated"}:{' '}
                      {enhancedIPData.analysis_timestamp
                        ? new Date(enhancedIPData.analysis_timestamp).toLocaleString()
                        : '—'}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Section>

      <Section
        variant="elevated"
        icon={Eye}
        title={"Telemetry"}
        subtitle={"Features"}
        id="telemetry"
      >
        <InsightFields fingerprint={fingerprintRef.current} />
      </Section>

      {/* SEO-Optimized Content Section */}
      <SEOContentSection />
    </div>
  );
};

export default function HomePage() {
  return (
    <QueryClientProvider client={queryClient}>
      <PageLayout>
        <ReportExperience />
      </PageLayout>
    </QueryClientProvider>
  );
}
