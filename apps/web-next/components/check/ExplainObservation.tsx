'use client';
import { useEffect, useRef, useState } from 'react';
import type { Observation } from '../../../../src/types/scan';
import { fetchWithApiFallback } from '@/lib/api';
import { readCompletionStream } from '@/lib/sse';
import { controlClass } from './CheckWorkspace';
export default function ExplainObservation({ label, observation }: { label: string; observation: Observation }) {
  const [text, setText] = useState('');
  const [state, setState] = useState('');
  const [busy, setBusy] = useState(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const context = { test: label, status: observation.status, limitation: observation.limitation };
  async function explain() {
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    setBusy(true);
    setText('');
    setState('Requesting an optional explanation…');
    const signal = AbortSignal.any([current.signal, AbortSignal.timeout(20000)]);
    try {
      const response = await fetchWithApiFallback('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Explain this observation status and its limitations. Do not infer unprovided measurements or claim a fix was verified. ${JSON.stringify(context)}`,
        }),
        signal,
      });
      if (!response.ok) throw new Error('Explanation unavailable');
      if (response.headers.get('content-type')?.includes('application/json')) {
        const data = await response.json();
        setText(data.content ?? 'No explanation returned.');
        setState(
          data.fallback
            ? 'Reference explanation — not generated live'
            : 'AI-generated explanation — verify against the evidence'
        );
      } else {
        if (!response.body) throw new Error('No stream');
        await readCompletionStream(response.body, setText, signal);
        setState('AI-generated explanation — verify against the evidence');
      }
    } catch {
      setState(
        'Explanation cancelled, unavailable or incomplete. Any partial text is unverified. The original observation is unchanged.'
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="border-t border-white/10 pt-3">
      <summary className="min-h-11 cursor-pointer py-2">Explain this result</summary>
      <p className="text-sm text-slate-400">
        Optional third-party processing through the Worker’s configured AI provider. Only the following context is sent;
        measured values, full IP and fingerprint identifiers are excluded.
      </p>
      <pre className="my-3 whitespace-pre-wrap break-all text-sm">{JSON.stringify(context, null, 2)}</pre>
      <button className={controlClass} disabled={busy} onClick={() => void explain()}>
        Send this context for explanation
      </button>
      {busy && (
        <button className={controlClass} onClick={() => controller.current?.abort()}>
          Cancel explanation
        </button>
      )}
      <p role="status" className="mt-3 text-sm">
        {state}
      </p>
      {text && <p className="mt-3 whitespace-pre-wrap">{text}</p>}
    </details>
  );
}
