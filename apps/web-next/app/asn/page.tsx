import { PageLayout } from '@/components/Layout/PageLayout';
import LookupWorkspace from '@/components/check/LookupWorkspace';
import { buildPageMetadata } from '@/lib/seo';
export const metadata = buildPageMetadata({
  title: 'ASN lookup',
  description: 'Query the IPhey built-in ASN directory and understand its coverage limits.',
  path: '/asn',
});
export default function ASNPage() {
  return (
    <PageLayout>
      <LookupWorkspace kind="asn" />
    </PageLayout>
  );
}
