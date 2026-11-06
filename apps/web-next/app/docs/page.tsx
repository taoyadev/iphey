import Link from 'next/link';
import { PageLayout } from '@/components/Layout/PageLayout';
import { buildPageMetadata } from '@/lib/seo';
export const metadata = buildPageMetadata({
  title: 'Help with checks and results',
  description: 'Start a check, understand evidence and recover from incomplete measurements.',
  path: '/docs',
});
export default function DocsPage() {
  return (
    <PageLayout>
      <h1 className="text-4xl font-semibold">Help with your check</h1>
      <nav className="flex flex-wrap gap-5">
        {[
          ['start', 'Start and repeat'],
          ['evidence', 'Read the evidence'],
          ['incomplete', 'Incomplete checks'],
          ['storage', 'Save and delete'],
        ].map(([id, title]) => (
          <a className="min-h-11 py-3 text-accent underline" key={id} href={`#${id}`}>
            {title}
          </a>
        ))}
      </nav>
      <section id="start" className="space-y-3">
        <h2 className="text-2xl font-semibold">Start and repeat</h2>
        <p>
          Choose a task on My check, review its scope and select Run check. Optional active probes run only when
          selected. Save a baseline, change one setting or network, repeat the same scope and open Compare.
        </p>
        <Link className="inline-block min-h-11 py-3 text-accent underline" href="/">
          Open My check
        </Link>
      </section>
      <section id="evidence" className="space-y-3">
        <h2 className="text-2xl font-semibold">Read the evidence</h2>
        <p>
          Each item shows an observation, source, time and limitation. Completion is separate from risk. A timezone
          difference can reflect travel, VPN use or database error. A network classification does not prove malicious
          activity. This version does not report population uniqueness.
        </p>
        <p>
          HTTP exit is the address observed for one request. WebRTC uses ICE candidates from a separate test. DNS and
          independent IPv4/IPv6 paths are not provided. No combination of missing results establishes that a connection
          is safe.
        </p>
      </section>
      <section id="incomplete" className="space-y-3">
        <h2 className="text-2xl font-semibold">Why a check is incomplete</h2>
        <ul className="list-disc space-y-3 pl-6">
          <li>Not run: the probe was not selected or the check was cancelled.</li>
          <li>
            Unsupported or blocked: a browser capability is missing or restricted. Continue with available evidence;
            disabling privacy protection is not required.
          </li>
          <li>Timeout: the probe did not complete before its deadline. Check connectivity, then retry.</li>
          <li>No result: a request completed without matching data or candidates. Consult the stated coverage.</li>
          <li>
            Unavailable: no usable provider result or no implemented capability. IP_DATA_UNAVAILABLE and
            CLIENT_IP_UNAVAILABLE do not imply low risk.
          </li>
          <li>
            Stale: an older cached result is retained with its original time. A failed refresh is not a successful new
            measurement.
          </li>
        </ul>
        <p>
          Browser probes have a three-second deadline; WebRTC has five seconds and network checks have an eight-second
          browser budget. Cancel stops updates to the current check. Browser security and network policy can affect
          results.
        </p>
      </section>
      <section id="storage" className="space-y-3">
        <h2 className="text-2xl font-semibold">Save, export and delete</h2>
        <p>
          Save on this device writes a versioned local record. If storage is blocked or full, the report remains in this
          tab. Export before leaving. Compare checks collector version, rule version, scope and source. Legacy records
          are retained but not treated as comparable new scans.
        </p>
        <p>
          Redacted exports omit measured values and identifiers. Technical export includes the values you explicitly
          select to export. Clear all local records removes current and legacy history plus associated saved copies.
        </p>
        <Link className="inline-block min-h-11 py-3 text-accent underline" href="/privacy">
          Read data handling details
        </Link>
      </section>
    </PageLayout>
  );
}
