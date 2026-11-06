import type {
  EnhancedIPResponse,
  FingerprintPayload,
  PanelKey,
  PanelResult,
  PanelStatus,
  ReportResponse,
  ServiceStatus,
} from '@/types/report';

export type HomeTab = 'overview' | 'fingerprint' | 'analysis' | 'monitor' | 'toolkit' | 'history' | 'ip-intel';

export interface PanelCopy {
  title: string;
  description: string;
}

export interface HomeSharedProps {
  reportData?: ReportResponse | null;
  enhancedIPData?: EnhancedIPResponse;
  isLoading: boolean;
  isFetching: boolean;
  activePanel: PanelKey;
  panelCopy: Record<PanelKey, PanelCopy>;
  fingerprint?: FingerprintPayload | null;
}

export interface HomeOverviewProps extends HomeSharedProps {
  active?: PanelResult | undefined;
  onPanelClick: (panelKey: PanelKey) => void;
}

export interface HomeAnalysisProps extends HomeSharedProps {}

export interface HomeFingerprintProps {
  fingerprint?: FingerprintPayload | null;
  onRegenerate: () => void;
}

export interface HomeToolkitProps {
  reportData?: ReportResponse | null;
  activePanel: PanelKey;
  onApplyRecommendation: (recId: string, solIdx: number) => void;
}

export interface HomeHistoryProps {
  reportData?: ReportResponse | null;
  onSaveRecord: (record: unknown) => void;
}

export interface HomeIpIntelProps {
  reportData?: ReportResponse | null;
  enhancedIPData?: EnhancedIPResponse;
  isLoadingEnhancedIP: boolean;
}

export interface HomeHeroProps {
  reportData?: ReportResponse | null;
  enhancedIPData?: EnhancedIPResponse;
  isLoading: boolean;
  isFetching: boolean;
  onRefresh: () => void;
  verdict: PanelStatus;
}

export interface HomeUniquenessProps {
  reportData?: ReportResponse | null;
}

export interface HomeServiceProps {
  serviceStatus?: ServiceStatus;
  isLoadingServiceStatus: boolean;
  showStatusBanner: boolean;
  onDismiss: () => void;
}
