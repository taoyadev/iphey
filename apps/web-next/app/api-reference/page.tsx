import type { Metadata } from 'next';
import APIReferenceClient from './APIReferenceClient';
import { API_URL, SITE_NAME, SITE_URL } from '@/lib/site';

const title = 'API Reference';
const description =
  'Documentation for the IPhey API, including report generation, health checks, and response field definitions.';
const canonical = `${SITE_URL}/api-reference`;

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
  other: {
    'api-base-url': `${API_URL}/api/v1`,
  },
};

export default function APIReferencePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <APIReferenceClient />
    </>
  );
}
