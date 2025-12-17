export type PanelStatus = 'trustworthy' | 'suspicious' | 'unreliable';

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
  fonts?: string[];
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
  enhancedFonts?: {
    hash: string;
    detected?: string[];
    base?: string[];
    totalTested?: number;
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

export interface ReportRequestBody {
  ip?: string;
  fingerprint: FingerprintPayload;
}

export interface PanelResult<TMeta = Record<string, unknown>> {
  status: PanelStatus;
  score: number;
  signals: string[];
  remediation?: string;
  meta?: TMeta;
}

export interface ReportResponse {
  verdict: PanelStatus;
  score: number;
  requestId?: string;
  panels: {
    browser: PanelResult;
    location: PanelResult;
    ipAddress: PanelResult;
    hardware: PanelResult;
    software: PanelResult;
  };
  ip?: string;
  fetchedAt: number;
  source: 'ipinfo' | 'radar' | 'mixed';
  enhanced?: {
    browser: {
      detailedSignals: Array<{
        message: string;
        impact: 'critical' | 'high' | 'medium' | 'low' | 'info';
        scorePenalty: number;
        explanation: string;
        recommendation?: string;
      }>;
      confidence: number;
      entropy: number;
      breakdown: Record<string, number>;
    };
    location: {
      detailedSignals: Array<{
        message: string;
        impact: 'critical' | 'high' | 'medium' | 'low' | 'info';
        scorePenalty: number;
        explanation: string;
        recommendation?: string;
      }>;
      confidence: number;
      entropy: number;
      breakdown: Record<string, number>;
    };
    ipAddress: {
      detailedSignals: Array<{
        message: string;
        impact: 'critical' | 'high' | 'medium' | 'low' | 'info';
        scorePenalty: number;
        explanation: string;
        recommendation?: string;
      }>;
      confidence: number;
      entropy: number;
      breakdown: Record<string, number>;
    };
    hardware: {
      detailedSignals: Array<{
        message: string;
        impact: 'critical' | 'high' | 'medium' | 'low' | 'info';
        scorePenalty: number;
        explanation: string;
        recommendation?: string;
      }>;
      confidence: number;
      entropy: number;
      breakdown: Record<string, number>;
    };
    software: {
      detailedSignals: Array<{
        message: string;
        impact: 'critical' | 'high' | 'medium' | 'low' | 'info';
        scorePenalty: number;
        explanation: string;
        recommendation?: string;
      }>;
      confidence: number;
      entropy: number;
      breakdown: Record<string, number>;
    };
  };
}
