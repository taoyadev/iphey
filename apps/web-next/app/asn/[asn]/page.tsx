import { notFound } from 'next/navigation';
import { PageLayout } from '@/components/Layout/PageLayout';
import LookupWorkspace from '@/components/check/LookupWorkspace';
import { ASN_SEEDS } from '@/lib/seo-data';
import { buildPageMetadata } from '@/lib/seo';
import { parseASN } from '../../../../../src/utils/networkInput';
export const dynamicParams = false;
export function generateStaticParams() {
  return ASN_SEEDS.map(asn => ({ asn: String(asn) }));
}
type Props = { params: Promise<{ asn: string }> };
export async function generateMetadata({ params }: Props) {
  const { asn } = await params;
  return buildPageMetadata({
    title: `AS${asn} lookup`,
    description: `Inspect directory information and coverage limits for AS${asn}.`,
    path: `/asn/${asn}`,
  });
}
export default async function Page({ params }: Props) {
  const { asn } = await params;
  const n = parseASN(asn);
  if (n === null || !(ASN_SEEDS as readonly number[]).includes(n)) notFound();
  return (
    <PageLayout>
      <LookupWorkspace kind="asn" initialValue={asn} />
      <p className="text-sm text-slate-400">
        This retained example URL always queries the selected ASN. Directory coverage is limited; routing prefixes and
        source dates are not provided.
      </p>
    </PageLayout>
  );
}
