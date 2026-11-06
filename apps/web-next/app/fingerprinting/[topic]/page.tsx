import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageLayout } from '@/components/Layout/PageLayout';
import CheckWorkspace from '@/components/check/CheckWorkspace';
import { FINGERPRINTING_TOPICS } from '@/lib/seo-data';
import { buildPageMetadata } from '@/lib/seo';
import type { ScanPreset } from '@/lib/scan';
export const dynamicParams = false;
export function generateStaticParams() {
  return FINGERPRINTING_TOPICS.map(topic => ({ topic: topic.slug }));
}
type Props = { params: Promise<{ topic: string }> };
export async function generateMetadata({ params }: Props) {
  const { topic } = await params;
  return buildPageMetadata({
    title: `${topic} browser test`,
    description: `Run the ${topic} probe and inspect measurements, limitations and repeatability.`,
    path: `/fingerprinting/${topic}`,
  });
}
export default async function Page({ params }: Props) {
  const { topic } = await params;
  if (!FINGERPRINTING_TOPICS.some(item => item.slug === topic)) notFound();
  return (
    <PageLayout>
      <CheckWorkspace initialPreset={topic as ScanPreset} fixed />
      <section className="space-y-4 border-t border-white/10 pt-6">
        <h2 className="text-2xl font-semibold">What this test can tell you</h2>
        <p>
          Run this test to observe one browser capability. Save a result, change one setting, then run it again with the
          same browser and test version.
        </p>
        <p>
          A hash summarizes a measured output. It does not show how many people share that output or prove that a
          browser is unique. Privacy protections may restrict these APIs; a blocked probe is an observation, not a
          judgment about you.
        </p>
        <p>
          Font results compare a fixed list of 24 candidate names against generic fallback metrics and list
          document-loaded fonts separately. They do not enumerate installed system fonts. WebRTC results depend on
          network reachability and browser privacy policy. An empty result cannot prove that no network information can
          leak.
        </p>
        <Link className="inline-block min-h-11 py-3 text-accent underline" href="/compare">
          Compare saved measurements
        </Link>
      </section>
    </PageLayout>
  );
}
