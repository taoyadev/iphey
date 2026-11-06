import { connectionResponseSchema } from '../../../src/schemas/scan';
import {
  COLLECTOR_VERSION,
  RULES_VERSION,
  SCAN_SCHEMA_VERSION,
  type ScanRecord,
  type Observation,
} from '../../../src/types/scan';
import {
  collectBasicFingerprint,
  collectCanvas,
  collectWebGL,
  collectAudio,
  collectFonts,
  collectPermissions,
  boundedProbe,
} from './fingerprint';
import { fetchWithApiFallback, describeApiFailure } from './api';
import { probeWebRTC } from './webrtc';
import { probeFailureStatus } from './probe-state';

export type ScanPreset = 'environment' | 'vpn' | 'compatibility' | 'canvas' | 'webgl' | 'audio' | 'fonts' | 'webrtc';

const observe = (value: unknown, source: string, limitation: string): Observation => ({
  status: 'observed',
  value,
  source,
  observedAt: Date.now(),
  limitation,
});

export async function runScan(
  preset: ScanPreset,
  activeProbes: boolean,
  signal: AbortSignal,
  progress: (record: ScanRecord) => void
): Promise<ScanRecord> {
  signal.throwIfAborted();
  const startedAt = Date.now();
  const fingerprint = collectBasicFingerprint();
  const record: ScanRecord = {
    schemaVersion: SCAN_SCHEMA_VERSION,
    collectorVersion: COLLECTOR_VERSION,
    rulesVersion: RULES_VERSION,
    scanId: crypto.randomUUID(),
    name: preset,
    subject: 'current-environment',
    scope: [],
    startedAt,
    completedAt: 0,
    fingerprint,
    observations: {},
  };
  const publish = () => {
    signal.throwIfAborted();
    progress({
      ...record,
      scope: [...record.scope],
      fingerprint: { ...record.fingerprint },
      observations: { ...record.observations },
    });
  };
  const set = (key: string, observation: Observation) => {
    record.observations[key] = observation;
    publish();
  };
  const jobs: Promise<void>[] = [];
  const probe = <T>(key: string, fn: () => Promise<T>, limitation: string, apply?: (value: T) => void) => {
    record.scope.push(key);
    jobs.push(
      (async () => {
        try {
          const value = await boundedProbe(fn, signal);
          signal.throwIfAborted();
          apply?.(value);
          set(key, observe(value, 'This browser', limitation));
        } catch (error) {
          signal.throwIfAborted();
          set(key, {
            status: probeFailureStatus(error),
            value: null,
            source: 'This browser',
            observedAt: Date.now(),
            limitation,
          });
        }
      })()
    );
  };
  record.observations.browser = observe(
    { ...fingerprint },
    'This browser',
    'Reported browser properties; these are not proof of identity or population uniqueness.'
  );
  record.scope.push('browser');
  if (['environment', 'vpn', 'compatibility'].includes(preset)) {
    record.scope.push('http', 'network');
    jobs.push(
      (async () => {
        try {
          const deadline = AbortSignal.timeout(8000);
          const response = await fetchWithApiFallback('/api/v2/connection', {
            signal: AbortSignal.any([signal, deadline]),
            cache: 'no-store',
          });
          if (!response.ok) throw new Error(await describeApiFailure(response));
          const parsed = connectionResponseSchema.safeParse(await response.json());
          if (!parsed.success) throw new Error('Invalid observation response');
          const data = parsed.data;
          set('http', { ...data.ip, requestId: data.requestId });
          set('network', { ...data.enrichment, requestId: data.requestId });
        } catch (error) {
          signal.throwIfAborted();
          for (const key of ['http', 'network'])
            set(key, {
              status: 'unavailable',
              value: null,
              source: 'IPhey Worker',
              observedAt: Date.now(),
              limitation: `${error instanceof Error && error.message.startsWith('Request failed (HTTP ') ? error.message : 'The connection request failed.'} No location, risk or safety conclusion is available. Retry this check.`,
            });
        }
      })()
    );
  }
  if (preset === 'compatibility')
    probe(
      'permissions',
      collectPermissions,
      'Reads existing permission states only. It never requests permission, precise location, camera or microphone access.',
      value => {
        record.fingerprint.permissions = value.filter(
          (item): item is { name: string; state: PermissionState } => item.state !== 'unavailable'
        );
      }
    );
  if (preset === 'compatibility')
    probe(
      'storage',
      async () => {
        const key = `iphey-probe-${record.scanId}`;
        try {
          localStorage.setItem(key, '1');
          return localStorage.getItem(key) === '1';
        } finally {
          localStorage.removeItem(key);
        }
      },
      'A temporary local-storage write/read test. Success does not guarantee future quota availability.'
    );
  const include = (key: string) => preset === key || (activeProbes && preset === 'environment');
  if (include('canvas'))
    probe('canvas', collectCanvas, 'Hash of one fixed drawing; not a population uniqueness estimate.', value => {
      record.fingerprint.canvas = value;
    });
  if (include('webgl') || preset === 'compatibility')
    probe(
      'webgl',
      collectWebGL,
      'Reported GPU properties may be masked by the browser. Vendor/renderer hash only; no pixel-rendering uniqueness estimate.',
      value => {
        record.fingerprint.webgl = value;
      }
    );
  if (include('audio'))
    probe('audio', collectAudio, 'Local, silent audio computation. No sound is played or recorded.', value => {
      record.fingerprint.audio = value;
    });
  if (include('fonts'))
    probe(
      'fonts',
      collectFonts,
      'Metric comparison for 24 named font candidates against three generic fallbacks. Distinct metrics suggest availability in this document; masking, aliases and equal metrics can affect results. Document-loaded FontFace entries are listed separately. This does not enumerate all installed fonts.',
      value => {
        record.fingerprint.enhancedFonts = value;
        record.fingerprint.fonts = value.detected;
      }
    );
  if (preset === 'webrtc' || (preset === 'vpn' && activeProbes)) {
    record.scope.push('webrtc');
    jobs.push(
      probeWebRTC(signal).then(value => {
        set('webrtc', value);
      })
    );
  }
  if (preset === 'vpn')
    for (const key of ['dns', 'dualStack'])
      record.observations[key] = {
        status: 'unavailable',
        value: null,
        source: 'IPhey',
        observedAt: Date.now(),
        limitation: 'This capability is not provided. This check cannot establish absence of DNS or IPv6 leaks.',
      };
  publish();
  await Promise.all(jobs);
  signal.throwIfAborted();
  record.completedAt = Date.now();
  publish();
  return record;
}
