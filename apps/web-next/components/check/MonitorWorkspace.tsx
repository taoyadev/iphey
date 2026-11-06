'use client';
import { useEffect, useRef, useState } from 'react';
import type { ScanRecord } from '../../../../src/types/scan';
import { controlClass } from './CheckWorkspace';
import { saveRecord } from '@/lib/records';
export default function MonitorWorkspace() {
  const [mode, setMode] = useState<'stopped' | 'running' | 'paused'>('stopped');
  const [seconds, setSeconds] = useState(60);
  const [startedAt, setStartedAt] = useState(0);
  const [now, setNow] = useState(0);
  const [last, setLast] = useState<ScanRecord | null>(null);
  const [message, setMessage] = useState('Stopped. No repeated requests are running.');
  const controller = useRef<AbortController | null>(null);
  useEffect(() => {
    if (mode !== 'paused') return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [mode]);
  useEffect(() => {
    if (mode !== 'running') return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function sample() {
      if (stopped || document.hidden) return;
      const current = new AbortController();
      controller.current = current;
      try {
        const { runScan } = await import('@/lib/scan');
        const result = await runScan('environment', false, current.signal, () => undefined);
        if (stopped || current.signal.aborted) return;
        setLast(result);
        setMessage(
          result.observations.http?.status === 'observed'
            ? 'Sample completed. Inspect its scope before drawing conclusions.'
            : 'Connection sample incomplete. Browser evidence is retained.'
        );
      } catch {
        if (!stopped) setMessage('Sample cancelled or failed. Last completed sample retained.');
      } finally {
        if (!stopped) timer = setTimeout(() => void sample(), seconds * 1000);
      }
    }
    const hidden = () => {
      if (document.hidden) {
        controller.current?.abort();
        setMode('paused');
        setMessage('Paused while this tab is hidden. Resume explicitly when ready.');
      }
    };
    document.addEventListener('visibilitychange', hidden);
    void sample();
    const clock = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      stopped = true;
      clearTimeout(timer);
      clearInterval(clock);
      controller.current?.abort();
      document.removeEventListener('visibilitychange', hidden);
    };
  }, [mode, seconds]);
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">Repeat basic checks in this tab</h2>
      <p className="text-sm text-slate-400">
        One sample at a time. No Canvas, Audio or STUN probes. Sampling pauses when the tab is hidden and stops when you
        leave. Each sample contacts the Worker and may query IP providers.
      </p>
      <label className="block">
        Seconds after each sample
        <select
          className={`${controlClass} ml-3`}
          value={seconds}
          disabled={mode === 'running'}
          onChange={e => setSeconds(Number(e.target.value))}
        >
          {[30, 60, 120, 300].map(n => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <div className="flex flex-wrap gap-3">
        <button
          className={controlClass}
          disabled={mode === 'running'}
          onClick={() => {
            if (mode === 'stopped') {
              setStartedAt(Date.now());
              setNow(Date.now());
            }
            setMode('running');
            setMessage('Sampling started.');
          }}
        >
          {mode === 'paused' ? 'Resume sampling' : 'Start sampling'}
        </button>
        <button
          className={controlClass}
          disabled={mode !== 'running'}
          onClick={() => {
            controller.current?.abort();
            setMode('paused');
            setMessage('Paused.');
          }}
        >
          Pause
        </button>
        <button
          className={controlClass}
          disabled={mode === 'stopped'}
          onClick={() => {
            controller.current?.abort();
            setMode('stopped');
            setNow(Date.now());
            setMessage('Stopped. In-flight work cancelled.');
          }}
        >
          Stop
        </button>
      </div>
      <p role="status">{message}</p>
      <p>
        Session elapsed: {startedAt ? Math.max(0, Math.floor((now - startedAt) / 1000)) : 0}s · Last completed sample:{' '}
        {last ? new Date(last.completedAt).toLocaleString() : 'None'}
      </p>
      {last && (
        <button
          className={controlClass}
          onClick={() => {
            try {
              saveRecord({ ...last, name: 'Monitor sample' });
              setMessage('Sample saved on this device.');
            } catch {
              setMessage('Save failed. Sample is retained in this tab.');
            }
          }}
        >
          Save last sample on this device
        </button>
      )}
    </section>
  );
}
