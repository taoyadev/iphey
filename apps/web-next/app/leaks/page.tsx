import type { Metadata } from 'next';
import LeaksClient from './LeaksClient';
import { SITE_NAME, SITE_URL } from '@/lib/site';

const title = 'Leaks';
const description =
  'Analyze browser and IP leak signals, compare leak surfaces, and verify that privacy protections are actually working.';
const canonical = `${SITE_URL}/leaks`;

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: SITE_NAME,
      item: SITE_URL,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: title,
      item: canonical,
    },
  ],
};

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical,
  },
  openGraph: {
    title: `${title} | ${SITE_NAME}`,
    description,
    url: canonical,
  },
  twitter: {
    title: `${title} | ${SITE_NAME}`,
    description,
  },
};

export default function LeaksPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <LeaksClient />
    </>
  );
}
