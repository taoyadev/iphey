import type { Metadata } from 'next';
import DocsClient from './DocsClient';
import { SITE_NAME, SITE_URL } from '@/lib/site';

const title = 'Docs';
const description =
  'Learn what IPhey measures, how browser fingerprinting works, and how to interpret the privacy and identity signals in your report.';
const canonical = `${SITE_URL}/docs`;

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

export default function DocsPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <DocsClient />
    </>
  );
}
