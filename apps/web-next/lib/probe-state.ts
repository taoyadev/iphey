import type { ProbeStatus } from '../../../src/types/scan';
export function probeFailureStatus(error: unknown): ProbeStatus {
  const name = error instanceof Error ? error.name : '';
  if (name === 'TimeoutError') return 'timeout';
  if (name === 'NotSupportedError') return 'unsupported';
  if (name === 'SecurityError' || name === 'NotAllowedError') return 'blocked';
  return 'unavailable';
}
