// Report and fingerprint type definitions

export type PanelStatus = 'trustworthy' | 'suspicious' | 'unreliable';
export type Verdict = PanelStatus;
export type PanelKey = 'browser' | 'location' | 'ipAddress' | 'hardware' | 'software';

export interface DetailedSignal {
  message: string;
  impact: 'critical' | 'high' | 'medium' | 'low' | 'info';
  scorePenalty: number;
  explanation: string;
  recommendation?: string;
}

export interface EnhancedPanelData {
  detailedSignals: DetailedSignal[];
  confidence: number;
  entropy: number;
  breakdown: Record<string, number>;
}

export interface PanelResult {
  status: PanelStatus;
  score: number;
  signals: string[];
  remediation?: string;
  meta?: Record<string, unknown>;
}

export interface ReportPanels {
  browser: PanelResult;
  location: PanelResult;
  ipAddress: PanelResult;
  hardware: PanelResult;
  software: PanelResult;
}

export interface ReportResponse {
  verdict: PanelStatus;
  score: number;
  requestId?: string;
  panels: ReportPanels;
  ip?: string;
  fetchedAt: number;
  source: 'ipinfo' | 'radar' | 'mixed';
  enhanced?: {
    browser: EnhancedPanelData;
    location: EnhancedPanelData;
    ipAddress: EnhancedPanelData;
    hardware: EnhancedPanelData;
    software: EnhancedPanelData;
  };
}

export interface FingerprintPayload {
  userAgent: string;
  acceptLanguage?: string;
  languages?: string[];
  timezone?: string;
  systemTime?: string;
  screen?: {
    width: number;
    height: number;
    colorDepth?: number;
    pixelRatio?: number;
    availWidth?: number;
    availHeight?: number;
  };
  platform?: string;
  hardwareConcurrency?: number;
  deviceMemory?: number;
  webglVendor?: string;
  webglRenderer?: string;
  canvasFingerprint?: string;
  audioFingerprint?: string;
  clientRectsHash?: string;
  legacyFonts?: string[];
  fontCount?: number;
  cookiesEnabled?: boolean;
  javaEnabled?: boolean;
  flashEnabled?: boolean;
  webrtcDisabled?: boolean;
  domStorageEnabled?: boolean;
  // Enhanced fingerprint structures
  canvas?: {
    hash: string;
    dataURL?: string;
    width: number;
    height: number;
    renderingTime?: number;
  };
  webgl?: {
    hash: string;
    vendor: string;
    renderer: string;
    unmaskedVendor?: string;
    unmaskedRenderer?: string;
    maxTextureSize?: number;
    extensions?: string[];
  };
  audio?: {
    hash: string;
    sampleRate?: number;
    numberOfOutputs?: number;
    channelCount?: number;
  };
  clientRects?: {
    hash: string;
    elementCount: number;
    totalVariance?: number;
    averageVariance?: number;
  };
  fonts?: {
    hash: string;
    detected?: string[];
    base?: string[];
    totalTested?: number;
  };
  webrtc?: {
    localIP?: string;
    publicIP?: string;
  };
  permissions?: Array<{
    name: string;
    state: 'granted' | 'denied' | 'prompt';
  }>;
  geolocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
}

export interface ReportRequest {
  ip?: string;
  fingerprint: FingerprintPayload;
}

// ===== Enhanced IP Detection Types =====

export type ThreatLevel = 'low' | 'medium' | 'high' | 'critical';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface ThreatProvider {
  source: string;
  is_listed: boolean;
  threat_types: string[];
  confidence: number;
  error?: string;
  last_checked?: string;
  list_type?: string;
  reports?: number;
}

export interface CombinedThreat {
  is_malicious: boolean;
  threat_score: number;
  threat_level: ThreatLevel;
  threat_types: string[];
  sources: string[];
  confidence: number;
}

export interface ThreatIntelligence {
  providers: {
    abuseipdb?: ThreatProvider;
    spamhaus?: ThreatProvider;
  };
  combined: CombinedThreat;
  timestamp: string;
}

export interface ASNInfo {
  asn: number;
  name: string;
  description?: string;
  country?: string;
  org_name?: string;
}

export interface ASNAnalysis {
  asn: number;
  info: ASNInfo;
  timestamp: string;
}

export interface RiskAssessment {
  overall_score: number;
  overall_level: RiskLevel;
  factors: string[];
  recommendation: string;
}

export interface EnhancedIPResponse {
  ip: string;
  geolocation: {
    ip: string;
    city?: string;
    region?: string;
    country: string;
    postal?: string;
    timezone?: string;
    latitude?: number;
    longitude?: number;
    org?: string;
    asn?: string;
    riskScore?: number;
    riskReasons?: string[];
    anycast?: boolean;
    bogon?: boolean;
    source: string;
    fetchedAt: number;
  };
  threats?: ThreatIntelligence;
  asn_analysis?: ASNAnalysis;
  risk_assessment: RiskAssessment;
  sources_used: string[];
  analysis_timestamp: string;
}

export interface ServiceStatus {
  geolocation: boolean;
  threat_intelligence: boolean;
  asn_analysis: boolean;
}
