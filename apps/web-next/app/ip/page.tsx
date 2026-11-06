import { PageLayout } from '@/components/Layout/PageLayout';
import LookupWorkspace from '@/components/check/LookupWorkspace';
import { buildPageMetadata } from '@/lib/seo';
export const metadata = buildPageMetadata({
  title: 'IP lookup',
  description: 'Look up an IPv4 or IPv6 address with source information and explicit missing data.',
  path: '/ip',
});
export default function IPPage() {
  return (
    <PageLayout>
      <LookupWorkspace />
    </PageLayout>
  );
}
