import type { PanelResult, PanelStatus } from '../../types/report';

/**
 * Detailed signal for enhanced panel evaluation
 */
export interface DetailedSignal {
  message: string;
  impact: 'critical' | 'high' | 'medium' | 'low' | 'info';
  scorePenalty: number;
  explanation: string;
  recommendation?: string;
}

/**
 * Enhanced panel result with additional metadata
 */
export interface EnhancedPanelResult extends PanelResult {
  detailedSignals: DetailedSignal[];
  confidence: number;
  entropy: number;
  breakdown: Record<string, number>;
}

/**
 * Convert score to status label
 */
export const statusFromScore = (score: number): PanelStatus => {
  if (score >= 80) return 'trustworthy';
  if (score >= 60) return 'suspicious';
  return 'unreliable';
};

/**
 * Clamp score between 0 and 100
 */
export const clampScore = (value: number) => Math.max(0, Math.min(100, value));

/**
 * Calculate Shannon entropy from a list of values
 */
export const calculateEntropy = (values: string[]): number => {
  if (!values.length) return 0;
  const uniqueValues = new Set(values);
  const probability = 1 / values.length;
  return -Math.log2(probability) * uniqueValues.size;
};

/**
 * Calculate confidence score based on signal impacts
 */
export const calculateConfidence = (signals: DetailedSignal[], baseConfidence: number): number => {
  const criticalCount = signals.filter(s => s.impact === 'critical').length;
  const highCount = signals.filter(s => s.impact === 'high').length;

  if (criticalCount > 0) return Math.max(20, baseConfidence - 30);
  if (highCount > 2) return Math.max(40, baseConfidence - 15);
  return baseConfidence;
};
