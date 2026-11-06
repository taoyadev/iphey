import Link from 'next/link';
import { PageLayout } from '@/components/Layout/PageLayout';
import { buildPageMetadata } from '@/lib/seo';
export const metadata = buildPageMetadata({
  title: 'Data handling and privacy',
  description: 'What IPhey collects locally, sends to providers, caches and saves on your device.',
  path: '/privacy',
});
export default function PrivacyPage() {
  return (
    <PageLayout>
      <h1 className="text-4xl font-semibold">How this version handles data</h1>
      <p>
        Updated November 6, 2026. These statements describe the application flow, not a promise that every
        infrastructure provider keeps no logs.
      </p>
      <div className="space-y-6">
        {[
          [
            'Browser checks',
            'After Run check, IPhey reads basic browser properties such as language, timezone and screen dimensions. Canvas, WebGL, silent Audio and bounded font measurements require the selected probe scope. The current workspace keeps these measurements in this tab; it does not send the fingerprint to the Worker. No precise geolocation is requested.',
          ],
          [
            'Connection and IP providers',
            'Connection requests reach the Cloudflare Worker, which observes the HTTP client IP. IP metadata may be queried from IPbot, IPinfo or Cloudflare Radar, depending on deployment configuration. Specified public IP queries send the queried address. Special-use IPs are classified locally in the lookup tool.',
          ],
          [
            'Active WebRTC',
            'When you select and run WebRTC, the browser contacts Google STUN at stun.l.google.com:19302. That server sees your network address. The test uses ICE gathering and requests no microphone or camera. Candidates remain in the current result unless saved or exported.',
          ],
          [
            'Local records',
            'Save on this device writes up to 50 versioned records in localStorage, including measured values and fingerprint hashes. The records remain until you delete them or browser storage is cleared. Compare provides individual deletion and clearing of current history, legacy history and associated saved copies. Browser sync, backups and other extensions are outside this control.',
          ],
          [
            'Cache and logs',
            'The Worker may cache IP metadata in memory or KV. Defaults are five minutes fresh and thirty minutes maximum age; IPbot defaults are up to 24 hours, with shorter high-risk cache periods. Deployment configuration may differ. HTTP access paths and operational errors can appear in platform logs. This repository does not establish the deployed log-retention settings, so no zero-retention claim is made.',
          ],
          [
            'Legacy report and optional AI interfaces',
            'The legacy report endpoint accepts a submitted fingerprint and evaluates it on the Worker. It remains a separate API from the current local observation workspace. The legacy optional AI endpoint can send supplied prompts, context and history to its configured provider. Explain this result sends only the displayed test name, status and limitation after a separate action. Measured values and fingerprint identifiers are excluded. Never send sensitive values unless you intend that processing.',
          ],
          [
            'Exports',
            'Default exports omit measured values, full IPs, coordinates and fingerprint identifiers. Choosing technical export includes the measured values. A file already exported to your device is not removed when you clear application history.',
          ],
        ].map(([title, text]) => (
          <section key={title} className="space-y-2">
            <h2 className="text-2xl font-semibold">{title}</h2>
            <p className="leading-7 text-slate-300">{text}</p>
          </section>
        ))}
      </div>
      <Link href="/compare" className="text-accent underline">
        Manage local records
      </Link>
    </PageLayout>
  );
}
