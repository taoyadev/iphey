import Link from 'next/link';
import { PageLayout } from '@/components/Layout/PageLayout';
import { buildPageMetadata } from '@/lib/seo';
import { API_URL } from '@/lib/site';
export const metadata = buildPageMetadata({
  title: 'API reference',
  description: 'Observation, IP, ASN and legacy report contracts for the IPhey Worker.',
  path: '/api-reference',
});
const endpoints = [
  [
    'GET',
    '/api/v2/connection',
    'Current HTTP exit and independent enrichment status. The response is no-store; an unavailable provider does not erase the observed HTTP exit.',
  ],
  [
    'GET',
    '/api/ip/:ip',
    'One validated public IPv4 or IPv6 address. Returns normalized provider data. Missing fields are omitted. Special-use addresses are rejected without querying providers.',
  ],
  [
    'GET',
    '/api/v1/asn/:asn',
    'Strict ASN input (13335 or AS13335). Built-in directory only. Unknown entries return status no-result; sourceDate is null.',
  ],
  [
    'POST',
    '/api/v1/report',
    'Legacy rule report. Supply fingerprint.userAgent plus measured Canvas and Audio hashes and a WebGL renderer, using nested objects or the legacy canvasFingerprint, audioFingerprint and webglRenderer fields. An ip is optional when the request IP is available. Missing measurements are not fabricated. This processes supplied fingerprint fields on the Worker. It is not a statistical uniqueness test. Missing risk evidence returns unavailable instead of a fabricated score.',
  ],
  ['GET', '/api/health', 'Worker reachability only; not a guarantee of provider health.'],
  [
    'GET',
    '/api/v1/services/status',
    'Instance observation status and last successful lookup time. This read does not actively validate upstream services.',
  ],
];
export default function APIPage() {
  return (
    <PageLayout>
      <h1 className="text-4xl font-semibold">Worker API reference</h1>
      <p>
        Base URL: <code className="break-all">{API_URL}</code>. Production execution belongs to the Worker. Example
        paths below are the contract of this version.
      </p>
      <div className="space-y-5">
        {endpoints.map(([method, path, description]) => (
          <section key={path} className="space-y-3 rounded-xl border border-white/10 p-5">
            <h2 className="break-all font-mono text-lg">
              {method} {path}
            </h2>
            <p>{description}</p>
          </section>
        ))}
      </div>
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Example request</h2>
        <pre className="overflow-auto rounded-xl bg-surface p-4">{`curl '${API_URL}/api/ip/1.1.1.1'`}</pre>
        <p>
          Use the{' '}
          <Link className="text-accent underline" href="/ip">
            IP lookup
          </Link>{' '}
          or{' '}
          <Link className="text-accent underline" href="/asn">
            ASN lookup
          </Link>{' '}
          for a bounded interactive request.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Observation response</h2>
        <pre className="overflow-auto whitespace-pre-wrap rounded-xl bg-surface p-4">
          {JSON.stringify(
            {
              schemaVersion: 2,
              requestId: 'request-id',
              ip: {
                status: 'observed',
                value: '203.0.113.10',
                source: 'HTTP request at Cloudflare',
                observedAt: 0,
                limitation: 'This request only',
              },
              enrichment: {
                status: 'unavailable',
                value: null,
                source: 'IP providers',
                observedAt: 0,
                limitation: 'No provider result',
              },
            },
            null,
            2
          )}
        </pre>
        <p className="text-sm text-slate-400">
          Illustrative response using a documentation address and placeholder timestamps. HTTP 200 can contain partial
          evidence.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Limits, errors and cache</h2>
        <p>
          Input errors return 400, special-use IP queries 422, oversized request bodies 413, unavailable providers 503,
          and unknown API routes 404. Request bodies are limited to 64 KiB. Read the error code and request ID where
          supplied; internal provider error bodies are not a public contract.
        </p>
        <p>
          Each uncached IP lookup attempts at most three configured providers, once each, with a shared 7.5-second
          provider deadline. The browser uses an eight-second total request budget and does not automatically restart
          cancelled checks. In-flight sharing is instance-local. Cache freshness and failed refreshes are explicit; a
          cached result retains its original fetchedAt.
        </p>
        <p>
          No global rate-limit guarantee is made by this version. A bounded per-instance limit protects request work; it
          is not a globally coordinated quota. Legacy enhanced risk endpoints can be unavailable when providers have not
          supplied a risk score.
        </p>
      </section>
    </PageLayout>
  );
}
