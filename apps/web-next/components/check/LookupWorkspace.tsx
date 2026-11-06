'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { parseIP, parseASN, asnCategory } from '../../../../src/utils/networkInput';
import type { NormalizedIpInsight } from '../../../../src/types/ip';
import { fetchWithApiFallback, describeApiFailure } from '@/lib/api';
import { controlClass } from './CheckWorkspace';

export default function LookupWorkspace({
  kind = 'ip',
  initialValue = '',
}: {
  kind?: 'ip' | 'asn';
  initialValue?: string;
}) {
  const [input, setInput] = useState(initialValue);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [message, setMessage] = useState('Enter an address or choose Use my IP. No query has run.');
  const [loading, setLoading] = useState(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get(kind);
    if (value) setInput(value.slice(0, 80));
    return () => controller.current?.abort();
  }, [kind]);
  async function lookup(myIP = false) {
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    let path = '';
    const parsed = kind === 'ip' ? parseIP(input) : null;
    const asn = kind === 'asn' ? parseASN(input) : null;
    if (!myIP) {
      if ((kind === 'ip' && !parsed) || (kind === 'asn' && asn === null)) {
        setMessage(
          kind === 'ip'
            ? 'Enter one valid IPv4 or IPv6 address, for example 1.1.1.1 or 2606:4700:4700::1111. URLs, CIDRs and batches are not supported.'
            : 'Enter an ASN such as AS13335 or 13335. Decimals, trailing text and reserved sentinel values are not accepted.'
        );
        setLoading(false);
        return;
      }
      if (parsed && parsed.category !== 'public') {
        setResult({ ip: parsed.ip, family: parsed.family, category: parsed.category });
        setMessage('Special-use address. Classified locally; no external geolocation request was made.');
        setLoading(false);
        return;
      }
      if (asn !== null && asnCategory(asn) !== 'public') {
        setResult({
          asn,
          category: asnCategory(asn),
          status: 'special-use',
          source: 'IANA special-purpose ASN classification',
        });
        setMessage('Special-use ASN. Classified locally; no external query was made.');
        setLoading(false);
        return;
      }
      path = kind === 'ip' ? `/api/ip/${encodeURIComponent(parsed!.ip)}` : `/api/v1/asn/${asn}`;
    } else path = '/api/v2/connection';
    setLoading(true);
    setMessage('Looking up this object… previous results retain their original time.');
    try {
      const response = await fetchWithApiFallback(path, {
        signal: AbortSignal.any([current.signal, AbortSignal.timeout(8000)]),
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(await describeApiFailure(response));
      let data = await response.json();
      current.signal.throwIfAborted();
      if (myIP) {
        if (!data.ip?.value) throw new Error('The HTTP exit was not observed.');
        setInput(data.ip.value);
        data = data.enrichment?.value ?? {
          ip: data.ip.value,
          observedAt: data.ip.observedAt,
          status: 'partial',
          source: data.ip.source,
          limitation: 'HTTP exit observed; IP metadata unavailable.',
        };
      }
      if (controller.current !== current) return;
      setResult(data);
      setMessage(
        data.status === 'no-result'
          ? 'This ASN is not in the built-in directory. No network profile is available.'
          : data.refreshFailed
            ? 'Refresh failed. Showing a bounded stale cached result at its original retrieval time.'
            : data.status === 'partial'
              ? 'Partial result: HTTP exit only.'
              : 'Lookup finished. Review source, time and missing fields.'
      );
    } catch (error) {
      if (controller.current === current)
        setMessage(
          current.signal.aborted
            ? 'Lookup cancelled. Previous result retained.'
            : `${error instanceof Error ? error.message : 'Lookup failed.'} Previous result retained; it is not a fresh result.`
        );
    } finally {
      if (controller.current === current) setLoading(false);
    }
  }
  const ip = result as Partial<NormalizedIpInsight> | null;
  const shareValue = result?.ip ?? result?.asn;
  return (
    <section className="space-y-6">
      <h1 className="text-4xl font-semibold">{kind === 'ip' ? 'Look up an IP address' : 'Look up an ASN'}</h1>
      <p className="text-slate-300">
        {kind === 'ip'
          ? 'Inspect network ownership, estimated location and provider observations for one address.'
          : 'Search the built-in ASN directory. Registration country, IP location and network coverage are separate facts.'}
      </p>
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={e => {
          e.preventDefault();
          void lookup();
        }}
      >
        <label className="min-w-0 flex-1 space-y-2">
          <span>{kind === 'ip' ? 'IPv4 or IPv6 address' : 'ASN'}</span>
          <input
            className={`${controlClass} block w-full`}
            value={input}
            maxLength={80}
            autoComplete="off"
            spellCheck={false}
            placeholder={kind === 'ip' ? '1.1.1.1 or 2606:4700:4700::1111' : 'AS13335'}
            onChange={e => setInput(e.target.value)}
          />
        </label>
        <button className={controlClass} disabled={loading} type="submit">
          {loading ? 'Looking up…' : kind === 'ip' ? 'Lookup IP' : 'Lookup ASN'}
        </button>
        {kind === 'ip' && (
          <button className={controlClass} disabled={loading} type="button" onClick={() => void lookup(true)}>
            Use my IP
          </button>
        )}
        {loading && (
          <button type="button" className={controlClass} onClick={() => controller.current?.abort()}>
            Cancel
          </button>
        )}
      </form>
      <p role="status" aria-live="polite">
        {message}
      </p>
      {result && (
        <div className="space-y-5 rounded-2xl border border-white/10 bg-surface/60 p-5">
          <h2 className="break-all text-2xl font-semibold">{String(shareValue ?? 'Query result')}</h2>
          {kind === 'ip' && (
            <dl className="grid gap-4 sm:grid-cols-2">
              {Object.entries({
                'Address family': parseIP(String(result.ip))?.family,
                Organization: ip?.org,
                ASN: ip?.asn,
                Country: ip?.country,
                Region: ip?.region,
                City: ip?.city,
                Timezone: ip?.timezone,
                Source: result.source,
                'Retrieved at': ip?.fetchedAt ? new Date(ip.fetchedAt).toLocaleString() : undefined,
                'Cache state': ip?.cacheStatus,
                'Provider observation date': 'Not provided',
                'Provider risk score': ip?.riskScore,
              }).map(([label, value]) => (
                <div key={label}>
                  <dt className="text-sm text-slate-400">{label}</dt>
                  <dd className="break-words">
                    {typeof value === 'string' || typeof value === 'number' ? value : 'Not provided'}
                  </dd>
                </div>
              ))}
            </dl>
          )}
          <p className="text-sm text-slate-400">
            {kind === 'ip'
              ? 'Geolocation is an estimate, not a precise physical location. VPN, proxy, Tor and hosting classifications do not by themselves indicate malicious activity. Provider scores are not calibrated across sources. Missing fields remain unknown.'
              : 'Directory entries are editorial reference material; a source observation date and complete routing prefixes are not provided. Examples do not enumerate all network assets.'}
          </p>
          <details>
            <summary className="min-h-11 cursor-pointer py-2">All returned evidence</summary>
            <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-all text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
          {ip?.asn && (
            <Link className="text-accent underline" href={`/asn?asn=${encodeURIComponent(ip.asn)}`}>
              Look up {ip.asn}
            </Link>
          )}
          <div className="flex flex-wrap gap-3">
            {(typeof shareValue === 'string' || typeof shareValue === 'number') && (
              <Link className={controlClass} href={`/${kind}?${kind}=${encodeURIComponent(String(shareValue))}`}>
                Shareable query link
              </Link>
            )}
            <button
              className={controlClass}
              onClick={() => {
                void navigator.clipboard.writeText(JSON.stringify(result, null, 2)).then(
                  () => setMessage('Copied this result, including its IP if present.'),
                  () => setMessage('Copy failed. Select the evidence text manually.')
                );
              }}
            >
              Copy result
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
