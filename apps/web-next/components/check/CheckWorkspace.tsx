'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
const ExplainObservation = dynamic(() => import('./ExplainObservation'), {
  loading: () => <p>Loading optional explanation controls…</p>,
});
import { useEffect, useRef, useState } from 'react';
import type { ScanRecord, IceCandidateObservation } from '../../../../src/types/scan';
import type { NormalizedIpInsight } from '../../../../src/types/ip';
import type { ScanPreset } from '@/lib/scan';
import { probeLabels } from '@/lib/probe-labels';
const MonitorWorkspace = dynamic(() => import('./MonitorWorkspace'));
const CanvasSample = dynamic(() => import('./CanvasSample'));

export const controlClass =
  'min-h-11 rounded-xl border border-white/20 bg-surface px-4 py-2 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:opacity-50';
const titles: Partial<Record<ScanPreset, string>> = {
  vpn: 'Check your connection for leaks',
  canvas: 'Run a Canvas test',
  webgl: 'Inspect WebGL',
  audio: 'Run an Audio test',
  fonts: 'Check font exposure',
  webrtc: 'Run a WebRTC test',
};

export default function CheckWorkspace({
  initialPreset = 'environment',
  fixed = false,
  embedded = false,
}: {
  initialPreset?: ScanPreset;
  fixed?: boolean;
  embedded?: boolean;
}) {
  const Heading = embedded ? 'h2' : 'h1';
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  const [preset, setPreset] = useState<ScanPreset>(initialPreset);
  const [activeProbes, setActiveProbes] = useState(false);
  const [record, setRecord] = useState<ScanRecord | null>(null);
  const [previous, setPrevious] = useState<ScanRecord | null>(null);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState('No check has run yet.');
  const [name, setName] = useState('');
  const [technicalExport, setTechnicalExport] = useState(false);
  const [exportFields, setExportFields] = useState<string[]>([]);
  const [monitorVisible, setMonitorVisible] = useState(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const start = async (retryPreset?: ScanPreset) => {
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    const last = record?.completedAt ? record : previous;
    setPrevious(last);
    setRunning(true);
    setMessage('Checking… browser results appear first.');
    try {
      const { runScan } = await import('@/lib/scan');
      current.signal.throwIfAborted();
      const result = await runScan(retryPreset ?? preset, retryPreset ? false : activeProbes, current.signal, value => {
        if (controller.current === current) setRecord(value);
      });
      if (controller.current !== current) return;
      const incomplete = Object.values(result.observations).filter(o => o.status !== 'observed').length;
      setMessage(
        incomplete
          ? `Check finished with ${incomplete} unavailable or incomplete items. No all-clear conclusion is possible.`
          : 'Selected checks completed. Review the evidence and limitations below.'
      );
    } catch {
      if (controller.current !== current) return;
      setRecord(last);
      setMessage(
        current.signal.aborted
          ? 'Check cancelled. Previous completed results are retained.'
          : 'This check failed. Previous completed results are retained; retry to collect new evidence.'
      );
    } finally {
      if (controller.current === current) setRunning(false);
    }
  };
  const network = record?.observations.network?.value as NormalizedIpInsight | null | undefined;
  const http = record?.observations.http?.value;
  const candidates = record?.observations.webrtc?.value as IceCandidateObservation[] | null | undefined;
  const differentExits = candidates?.filter(
    c => c.addressKind === 'public' && typeof http === 'string' && c.address !== http
  );
  const observed = record ? Object.values(record.observations).filter(o => o.status === 'observed').length : 0;
  const all = record ? Object.values(record.observations).length : 0;
  return (
    <section id="interactive-analysis" className="space-y-6 scroll-mt-28">
      <div className="grid gap-6 lg:grid-cols-[1.1fr,1fr]">
        <div className="space-y-5">
          <p className="text-sm font-medium text-accent">IPhey · Check, understand, adjust, compare</p>
          <Heading className="text-3xl font-semibold tracking-tight text-white md:text-5xl">
            {titles[initialPreset] ?? 'Check your browser and connection'}
          </Heading>
          <p className="text-slate-300">
            See the information exposed by your browser, inspect your connection, and compare changes.
          </p>
          {!fixed && (
            <label className="block space-y-2">
              <span>What would you like to check?</span>
              <select
                className={`${controlClass} block w-full`}
                value={preset}
                disabled={!ready || running}
                onChange={e => {
                  setPreset(e.target.value as ScanPreset);
                  setActiveProbes(false);
                }}
              >
                <option value="environment">Current environment</option>
                <option value="vpn">VPN / proxy changes</option>
                <option value="compatibility">Website compatibility</option>
              </select>
            </label>
          )}
          {(preset === 'environment' || preset === 'vpn') && (
            <label className="flex min-h-11 items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={activeProbes}
                disabled={!ready || running}
                onChange={e => setActiveProbes(e.target.checked)}
              />
              {preset === 'vpn'
                ? 'Include active WebRTC / STUN test'
                : 'Include Canvas, WebGL, Audio and bounded font probes'}
            </label>
          )}
          {(preset === 'webrtc' || preset === 'vpn') && (
            <p className="text-sm text-slate-300">
              Active WebRTC contacts Google STUN and shares your network address. No camera or microphone is requested.
            </p>
          )}
          <details className="text-sm text-slate-300">
            <summary className="min-h-11 cursor-pointer py-3">Scope and data handling</summary>
            <p className="text-sm leading-6 text-slate-400">
              Browser measurements stay in this tab unless you save or export. Connection checks contact our Worker and
              IP data providers.{' '}
              {preset === 'webrtc' || preset === 'vpn'
                ? 'The active WebRTC test contacts Google STUN (stun.l.google.com:19302), which receives your network address. No camera or microphone permission is requested.'
                : 'No precise location or AI request is made.'}{' '}
              <Link href="/privacy" className="text-accent underline">
                Data details
              </Link>
            </p>
          </details>
          <div className="flex flex-wrap gap-3">
            <button
              className={cn(controlClass, 'bg-accent text-slate-950 font-semibold')}
              disabled={!ready || running}
              onClick={() => void start()}
            >
              {running ? 'Checking…' : record ? 'Run check again' : 'Run check'}
            </button>
            {running && (
              <button className={controlClass} onClick={() => controller.current?.abort()}>
                Cancel
              </button>
            )}
            <Link className={controlClass} href="/compare">
              Compare records
            </Link>
          </div>
        </div>
        <div className="min-w-0 rounded-2xl border border-white/10 bg-surface/70 p-5 space-y-4" aria-busy={running}>
          <h2 className="text-xl font-semibold">Current check</h2>
          <p role="status" aria-live="polite">
            {message}
          </p>
          {record && (
            <>
              <p>
                {observed} observed · {all - observed} incomplete / unavailable
              </p>
              <p className="break-all">HTTP exit: {typeof http === 'string' ? http : 'Not observed'}</p>
              <p>
                ASN: {network?.asn ?? 'Not observed'} · {network?.org ?? 'Organization unavailable'}
              </p>
              <p className="text-sm text-slate-400">
                Started {new Date(record.startedAt).toLocaleString()} ·{' '}
                {record.completedAt ? 'Finished' : 'In progress'}
              </p>
            </>
          )}
          {network?.cacheStatus === 'stale' && (
            <p className="text-amber-200">
              IP metadata refresh failed. These cached values retain their original retrieval time.
            </p>
          )}
          {network?.timezone && record?.fingerprint.timezone !== network.timezone && (
            <p className="text-amber-200">
              Timezone difference: browser {record?.fingerprint.timezone}; IP database {network.timezone}. VPN use,
              travel or database error can explain this. Compare after changing one setting.
            </p>
          )}
          {!!differentExits?.length && (
            <p className="text-amber-200">
              WebRTC observed a different public address from this HTTP request. Review candidate types below; this
              difference alone does not identify a leak.
            </p>
          )}
          {preset === 'vpn' && (
            <p className="text-sm text-slate-300">
              Save a baseline, switch your VPN, then run the same scope again. DNS and independent IPv4/IPv6 checks are
              not provided.
            </p>
          )}
        </div>
      </div>
      {record && (
        <>
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold">Observed evidence</h2>
            {Object.entries(record.observations).map(([key, item]) => (
              <details key={key} className="rounded-xl border border-white/10 p-4">
                <summary className="min-h-11 cursor-pointer py-2 font-medium">
                  {probeLabels[key] ?? key} <span className="ml-2 text-sm text-accent">{item.status}</span>
                </summary>
                <div className="space-y-3 pt-3">
                  <p className="text-sm text-slate-400">
                    Source: {item.source} · {new Date(item.observedAt).toLocaleString()}
                  </p>
                  {key === 'canvas' && item.status === 'observed' && <CanvasSample />}
                  {item.requestId && <p className="break-all text-xs text-slate-400">Request ID: {item.requestId}</p>}
                  <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-black/20 p-3 text-sm">
                    {item.value === null ? 'No measurement available' : JSON.stringify(item.value, null, 2)}
                  </pre>
                  <p className="text-sm text-slate-300">{item.limitation}</p>
                  <p className="text-sm">
                    Next: save this result, change one setting, and repeat the same scope.{' '}
                    <Link className="text-accent underline" href="/docs#incomplete">
                      Understand incomplete checks
                    </Link>
                  </p>
                  {item.status !== 'observed' &&
                    ['http', 'network', 'canvas', 'webgl', 'audio', 'fonts', 'webrtc'].includes(key) && (
                      <button
                        className={controlClass}
                        disabled={!ready || running}
                        onClick={() =>
                          void start(key === 'http' || key === 'network' ? 'environment' : (key as ScanPreset))
                        }
                      >
                        Retry this check as a separate measurement
                      </button>
                    )}
                  <ExplainObservation
                    key={`${record.scanId}-${key}`}
                    label={probeLabels[key] ?? key}
                    observation={item}
                  />
                </div>
              </details>
            ))}
          </div>
          {!!record.completedAt && !running && (
            <div className="space-y-3 border-t border-white/10 pt-5">
              <label className="block">
                Record name
                <input
                  className={`${controlClass} mt-2 block w-full max-w-md`}
                  maxLength={80}
                  value={name}
                  placeholder="VPN off / VPN on"
                  onChange={e => setName(e.target.value)}
                />
              </label>
              <div className="flex flex-wrap gap-3">
                <button
                  className={controlClass}
                  onClick={async () => {
                    try {
                      const { saveRecord } = await import('@/lib/records');
                      saveRecord({ ...record, name: name.trim() || record.name });
                      setMessage('Saved on this device. Open Compare to select the baseline.');
                    } catch {
                      setMessage(
                        'Could not save on this device. Storage may be blocked or full. Your result remains here; export it before leaving.'
                      );
                    }
                  }}
                >
                  Save on this device
                </button>
                <button
                  className={controlClass}
                  onClick={async () => {
                    try {
                      const { exportRecord } = await import('@/lib/records');
                      exportRecord(record, technicalExport, exportFields);
                      setMessage('Export prepared.');
                    } catch {
                      setMessage('Export failed. Your result remains available in this tab.');
                    }
                  }}
                >
                  Export {technicalExport ? 'technical data' : 'redacted summary'}
                </button>
              </div>
              <label className="flex min-h-11 items-center gap-3 text-sm">
                <input type="checkbox" checked={technicalExport} onChange={e => setTechnicalExport(e.target.checked)} />
                Include measured values, full IP and fingerprint identifiers in technical export
              </label>
              {technicalExport && (
                <fieldset className="space-y-2">
                  <legend>Select measured fields to include</legend>
                  {Object.keys(record.observations).map(key => (
                    <label key={key} className="flex min-h-11 items-center gap-3">
                      <input
                        type="checkbox"
                        checked={exportFields.includes(key)}
                        onChange={event =>
                          setExportFields(fields =>
                            event.target.checked ? [...fields, key] : fields.filter(field => field !== key)
                          )
                        }
                      />
                      {probeLabels[key] ?? key}
                    </label>
                  ))}
                </fieldset>
              )}
            </div>
          )}
        </>
      )}
      {!fixed && (
        <details
          className="border-t border-white/10 pt-4"
          onToggle={event => setMonitorVisible(event.currentTarget.open)}
        >
          <summary className="min-h-11 cursor-pointer">Advanced: repeat basic checks</summary>
          {monitorVisible && <MonitorWorkspace />}
        </details>
      )}
      {previous && previous.scanId !== record?.scanId && (
        <details className="border-t border-white/10 pt-4">
          <summary>Previous completed result · {new Date(previous.completedAt).toLocaleString()}</summary>
          <p className="mt-2 text-sm">Retained separately from this check. It has not been refreshed.</p>
          <button
            className={controlClass}
            onClick={async () => {
              try {
                const { exportRecord } = await import('@/lib/records');
                exportRecord(previous);
              } catch {
                setMessage('Export failed. Your previous result remains in this tab.');
              }
            }}
          >
            Export previous redacted summary
          </button>
        </details>
      )}
    </section>
  );
}
