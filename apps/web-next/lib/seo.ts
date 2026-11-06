import type { Metadata } from 'next';
import { SITE_NAME, absoluteUrl } from '@/lib/site';

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

interface BuildMetadataOptions {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
}

export const buildPageMetadata = ({ title, description, path, keywords = [] }: BuildMetadataOptions): Metadata => {
  const canonical = absoluteUrl(path);

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url: canonical,
      type: 'article',
    },
    twitter: {
      title: `${title} | ${SITE_NAME}`,
      description,
    },
  };
};

export const buildBreadcrumbJsonLd = (items: BreadcrumbItem[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: absoluteUrl(item.path),
  })),
});

export const buildFaqJsonLd = (faqs: FaqItem[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(faq => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
});

export const buildArticleJsonLd = (input: {
  type?: 'Article' | 'TechArticle';
  title: string;
  description: string;
  path: string;
  publishedTime?: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': input.type ?? 'Article',
  headline: input.title,
  description: input.description,
  url: absoluteUrl(input.path),
  datePublished: input.publishedTime,
  dateModified: input.publishedTime,
  author: {
    '@type': 'Organization',
    name: SITE_NAME,
  },
  publisher: {
    '@type': 'Organization',
    name: SITE_NAME,
  },
});

export const buildDatasetJsonLd = (input: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
}) => ({
  '@context': 'https://schema.org',
  '@type': 'Dataset',
  name: input.title,
  description: input.description,
  url: absoluteUrl(input.path),
  keywords: input.keywords,
  creator: {
    '@type': 'Organization',
    name: SITE_NAME,
  },
});

export const buildOrganizationJsonLd = (input: { name: string; description: string; path: string }) => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: input.name,
  description: input.description,
  url: absoluteUrl(input.path),
});
