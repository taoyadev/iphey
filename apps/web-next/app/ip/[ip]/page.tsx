import { notFound } from 'next/navigation';
import { PageLayout } from '@/components/Layout/PageLayout';
import LookupWorkspace from '@/components/check/LookupWorkspace';
import { SEO_IP_SEEDS } from '@/lib/seo-data';
import { buildPageMetadata } from '@/lib/seo';
export const dynamicParams = false;
export function generateStaticParams() {
  return SEO_IP_SEEDS.map(ip => ({ ip }));
}
type Props = { params: Promise<{ ip: string }> };
export async function generateMetadata({ params }: Props) {
  const { ip } = await params;
  return buildPageMetadata({
    title: `IP ${ip} lookup`,
    description: `Inspect source-backed network information for ${ip}.`,
    path: `/ip/${ip}`,
  });
}
export default async function Page({ params }: Props) {
  const { ip } = await params;
  if (!(SEO_IP_SEEDS as readonly string[]).includes(ip)) notFound();
  return (
    <PageLayout>
      <LookupWorkspace initialValue={ip} />
      <p className="text-sm text-slate-400">
        This retained example URL pre-fills the same IP for every query. No live provider result is embedded at build
        time.
      </p>
    </PageLayout>
  );
}
