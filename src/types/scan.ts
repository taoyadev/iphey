import type { FingerprintPayload } from './report';
import type { NormalizedIpInsight } from './ip';

export const SCAN_SCHEMA_VERSION = 2 as const;
export const COLLECTOR_VERSION = '2.0.1';
export const RULES_VERSION = 'observations-1';
export type ProbeStatus =
  'observed' | 'not-run' | 'unsupported' | 'blocked' | 'timeout' | 'no-result' | 'unavailable' | 'error';
export interface Observation<T = unknown> {
  status: ProbeStatus;
  value: T | null;
  source: string;
  requestId?: string;
  observedAt: number;
  retrievedAt?: number;
  sourceObservedAt?: number | null;
  limitation: string;
}
export interface IceCandidateObservation {
  type: string;
  address: string;
  protocol: string;
  addressKind: 'public' | 'private' | 'mdns' | 'unknown';
}
export interface ConnectionObservation {
  schemaVersion: 2;
  requestId: string;
  ip: Observation<string>;
  enrichment: Observation<NormalizedIpInsight>;
}
export interface ScanRecord {
  schemaVersion: 2;
  collectorVersion: string;
  rulesVersion: string;
  scanId: string;
  name: string;
  subject: 'current-environment';
  scope: string[];
  startedAt: number;
  completedAt: number;
  fingerprint: FingerprintPayload;
  observations: Record<string, Observation>;
}
