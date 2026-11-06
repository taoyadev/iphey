import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageLayout } from '@/components/Layout/PageLayout';
import { buildPageMetadata } from '@/lib/seo';
const comparisons = {
  browserleaks: {
    name: 'BrowserLeaks',
    url: 'https://browserleaks.com/',
    task: 'Inspect raw browser exposure',
    evidence:
      'The official index lists IP, JavaScript, WebRTC, Canvas, WebGL, font and TLS tools. Its WebRTC description explicitly discusses STUN-based observations.',
    steps:
      'Open its WebRTC tool and record candidate types, addresses and test conditions. Run IPhey with active WebRTC enabled under the same conditions, then compare the observed evidence and limitations.',
  },
  whoer: {
    name: 'Whoer',
    url: 'https://whoer.net/',
    task: 'Inspect the current network connection',
    evidence:
      'The official homepage includes IP address details, a WebRTC section and links to a DNS leak test, speed test and Whois.',
    steps:
      'Record the HTTP exit and named network fields before and after a VPN change. Repeat the same task in IPhey. Check source and time; do not compare differently defined scores as one scale.',
  },
  'cover-your-tracks': {
    name: 'Cover Your Tracks',
    url: 'https://coveryourtracks.eff.org/',
    task: 'Understand tracking-test scope',
    evidence:
      'The EFF homepage offers a browser tracking and fingerprinting test and links to its data-handling explanation. Its stated task is assessing protection from tracking and identifying browser characteristics.',
    steps:
      'Read the EFF test scope and privacy information before running it. IPhey instead exposes selected observations and local before/after comparison; it has no calibrated population uniqueness estimate.',
  },
};
export const dynamicParams = false;
export function generateStaticParams() {
  return Object.keys(comparisons).map(competitor => ({ competitor }));
}
type Props = { params: Promise<{ competitor: string }> };
export async function generateMetadata({ params }: Props) {
  const { competitor } = await params;
  return buildPageMetadata({
    title: `IPhey and ${competitor}: compare tasks`,
    description: 'A sourced task comparison with repeatable steps and explicit scope limits.',
    path: `/vs/${competitor}`,
  });
}
export default async function Page({ params }: Props) {
  const { competitor } = await params;
  const item = comparisons[competitor as keyof typeof comparisons];
  if (!item) notFound();
  return (
    <PageLayout>
      <h1 className="text-4xl font-semibold">IPhey and {item.name}</h1>
      <p>Task: {item.task}</p>
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">What the official page describes</h2>
        <p>
          {item.evidence}{' '}
          <a className="text-accent underline" href={item.url}>
            Official {item.name} page
          </a>
        </p>
        <p className="text-sm text-slate-400">
          Source text checked November 6, 2026. This is a scope comparison, not a measured speed, coverage or accuracy
          ranking.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Repeat the same task</h2>
        <p>{item.steps}</p>
        <p>
          Use the same browser and network settings. Record time, blocked probes and sources. A score, hash or empty
          result from one tool cannot be interpreted using another tool’s method.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">IPhey’s current limits</h2>
        <p>
          IPhey provides explicit observations, optional active WebRTC, IP/ASN queries and local comparison. DNS
          resolver challenges and independent IPv4/IPv6 path checks are not provided. No all-clear conclusion is made
          from missing data.
        </p>
        <Link className="inline-block min-h-11 py-3 text-accent underline" href="/leaks">
          Open the connection workspace
        </Link>
      </section>
    </PageLayout>
  );
}
