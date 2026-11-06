import { PageLayout } from '@/components/Layout/PageLayout';
import CompareWorkspace from '@/components/check/CompareWorkspace';
import { buildPageMetadata } from '@/lib/seo';
export const metadata = buildPageMetadata({
  title: 'Compare browser and connection checks',
  description: 'Compare two locally saved measurements, with missing and incomparable data clearly identified.',
  path: '/compare',
});
export default function ComparePage() {
  return (
    <PageLayout>
      <CompareWorkspace />
    </PageLayout>
  );
}
