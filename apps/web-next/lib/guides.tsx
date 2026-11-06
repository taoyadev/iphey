import fs from 'node:fs/promises';
import path from 'node:path';
import type { ComponentType } from 'react';
import type { FaqItem } from '@/lib/seo';

export interface GuideMeta {
  slug:
    | 'how-to-test-vpn-leaks'
    | 'browser-fingerprinting-explained'
    | 'how-to-reduce-browser-uniqueness'
    | 'proxy-vs-vpn-vs-tor-for-fingerprint-privacy'
    | 'how-ip-reputation-affects-risk-detection'
    | 'how-iphey-scores-digital-identity';
  title: string;
  description: string;
  publishedAt: string;
  category: 'Privacy' | 'Fingerprinting' | 'Methodology';
  summaries: string[];
  faq: FaqItem[];
  relatedRoutes: Array<{
    href: string;
    label: string;
    description: string;
  }>;
}

export const GUIDES: GuideMeta[] = [
  {
    slug: 'how-to-test-vpn-leaks',
    title: 'Check VPN changes with a baseline',
    description:
      'Open the leak workspace with the VPN in your initial state. Select active WebRTC only if you agree to contact the disclosed STUN server. Run the check, inspect the observed HTTP exit and candidates, and save a record named VPN off.',
    publishedAt: '2026-11-06',
    category: 'Privacy',
    summaries: [
      'Open the leak workspace with the VPN in your initial state. Select active WebRTC only if you agree to contact the disclosed STUN server. Run the check, inspect the observed HTTP exit and candidates, and save a record named VPN off.',
    ],
    faq: [],
    relatedRoutes: [
      {
        href: '/leaks',
        label: 'Open the leak workspace',
        description: 'Run the described task with explicit scope.',
      },
      {
        href: '/compare',
        label: 'Compare saved records',
        description: 'Review changes and incomparable fields.',
      },
    ],
  },
  {
    slug: 'browser-fingerprinting-explained',
    title: 'Understand browser exposure through measurements',
    description:
      'A browser exposes properties such as language, timezone and screen dimensions. Optional APIs also expose rendering and audio outputs. Open an individual test and inspect its source, status and limitation.',
    publishedAt: '2026-11-06',
    category: 'Fingerprinting',
    summaries: [
      'A browser exposes properties such as language, timezone and screen dimensions. Optional APIs also expose rendering and audio outputs. Open an individual test and inspect its source, status and limitation.',
    ],
    faq: [],
    relatedRoutes: [
      {
        href: '/fingerprinting/canvas',
        label: 'Run a Canvas test',
        description: 'Run the described task with explicit scope.',
      },
      {
        href: '/compare',
        label: 'Compare saved records',
        description: 'Review changes and incomparable fields.',
      },
    ],
  },
  {
    slug: 'how-to-reduce-browser-uniqueness',
    title: 'Change one privacy setting and measure the result',
    description:
      'Decide whether you want to reduce a particular exposed field or diagnose a broken website. There is no population sample in this tool, so it cannot promise a reduction in your percentage uniqueness.',
    publishedAt: '2026-11-06',
    category: 'Privacy',
    summaries: [
      'Decide whether you want to reduce a particular exposed field or diagnose a broken website. There is no population sample in this tool, so it cannot promise a reduction in your percentage uniqueness.',
    ],
    faq: [],
    relatedRoutes: [
      {
        href: '/compare',
        label: 'Open Compare',
        description: 'Run the described task with explicit scope.',
      },
      {
        href: '/compare',
        label: 'Compare saved records',
        description: 'Review changes and incomparable fields.',
      },
    ],
  },
  {
    slug: 'proxy-vs-vpn-vs-tor-for-fingerprint-privacy',
    title: 'Match a network tool to the task you can test',
    description:
      'For a browser-only proxy, inspect the requests it is configured to carry. For a VPN, inspect the connection before and after the tunnel is enabled. For Tor, consult the Tor Browser documentation and its own connection guidance. This guide does not rank the tools by a single safety score.',
    publishedAt: '2026-11-06',
    category: 'Privacy',
    summaries: [
      'For a browser-only proxy, inspect the requests it is configured to carry. For a VPN, inspect the connection before and after the tunnel is enabled. For Tor, consult the Tor Browser documentation and its own connection guidance. This guide does not rank the tools by a single safety score.',
    ],
    faq: [],
    relatedRoutes: [
      {
        href: '/leaks',
        label: 'Compare network changes',
        description: 'Run the described task with explicit scope.',
      },
      {
        href: '/compare',
        label: 'Compare saved records',
        description: 'Review changes and incomparable fields.',
      },
    ],
  },
  {
    slug: 'how-ip-reputation-affects-risk-detection',
    title: 'Understand IP sources and provider risk labels',
    description:
      'Enter a single IPv4 or IPv6 address. Private, loopback, link-local and reserved addresses receive local classification instead of being sent to public geolocation providers. A static detail URL keeps its original query object.',
    publishedAt: '2026-11-06',
    category: 'Methodology',
    summaries: [
      'Enter a single IPv4 or IPv6 address. Private, loopback, link-local and reserved addresses receive local classification instead of being sent to public geolocation providers. A static detail URL keeps its original query object.',
    ],
    faq: [],
    relatedRoutes: [
      {
        href: '/ip',
        label: 'Look up an IP',
        description: 'Run the described task with explicit scope.',
      },
      {
        href: '/compare',
        label: 'Compare saved records',
        description: 'Review changes and incomparable fields.',
      },
    ],
  },
  {
    slug: 'how-iphey-scores-digital-identity',
    title: 'IPhey observation methods and compatibility rules',
    description:
      'The current workspace uses schema version 2, collector 2.0.0 and rules observations-1. It presents observed values and limitations instead of a population uniqueness percentage or a judgment about a person.',
    publishedAt: '2026-11-06',
    category: 'Methodology',
    summaries: [
      'The current workspace uses schema version 2, collector 2.0.0 and rules observations-1. It presents observed values and limitations instead of a population uniqueness percentage or a judgment about a person.',
    ],
    faq: [],
    relatedRoutes: [
      {
        href: '/',
        label: 'Run a check',
        description: 'Run the described task with explicit scope.',
      },
      {
        href: '/compare',
        label: 'Compare saved records',
        description: 'Review changes and incomparable fields.',
      },
    ],
  },
];

export interface GuideRecord extends GuideMeta {
  Content: ComponentType;
  headings: Array<{ id: string; text: string }>;
}

const CONTENT_DIR = path.join(process.cwd(), 'content', 'guides');

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const parseHeadings = (body: string) =>
  body
    .split('\n')
    .filter(line => line.startsWith('## '))
    .map(line => {
      const text = line.replace(/^## /, '').trim();
      return { id: slugify(text), text };
    });

const guideImports = {
  'how-to-test-vpn-leaks': () => import('@/content/guides/how-to-test-vpn-leaks.mdx'),
  'browser-fingerprinting-explained': () => import('@/content/guides/browser-fingerprinting-explained.mdx'),
  'how-to-reduce-browser-uniqueness': () => import('@/content/guides/how-to-reduce-browser-uniqueness.mdx'),
  'proxy-vs-vpn-vs-tor-for-fingerprint-privacy': () =>
    import('@/content/guides/proxy-vs-vpn-vs-tor-for-fingerprint-privacy.mdx'),
  'how-ip-reputation-affects-risk-detection': () =>
    import('@/content/guides/how-ip-reputation-affects-risk-detection.mdx'),
  'how-iphey-scores-digital-identity': () => import('@/content/guides/how-iphey-scores-digital-identity.mdx'),
} satisfies Record<GuideMeta['slug'], () => Promise<{ default: ComponentType }>>;

export async function getGuideBySlug(slug: GuideMeta['slug']): Promise<GuideRecord> {
  const meta = GUIDES.find(entry => entry.slug === slug);
  if (!meta) {
    throw new Error(`Unknown guide: ${slug}`);
  }

  const [body, module] = await Promise.all([
    fs.readFile(path.join(CONTENT_DIR, `${slug}.mdx`), 'utf8'),
    guideImports[slug](),
  ]);

  return {
    ...meta,
    Content: module.default,
    headings: parseHeadings(body),
  };
}

export const getAllGuides = () =>
  GUIDES.slice().sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
