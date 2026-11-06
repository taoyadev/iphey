import type { MetadataRoute } from 'next';
import { SITE_URL, absoluteUrl } from '@/lib/site';
import { GUIDES } from '@/lib/guides';
import { ASN_SEEDS, COMPARISON_PAGES, FINGERPRINTING_TOPICS, SEO_IP_SEEDS } from '@/lib/seo-data';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const coreRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/docs`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/api-reference`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: absoluteUrl('/leaks'),
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: absoluteUrl('/guides'),
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ];

  const guideRoutes: MetadataRoute.Sitemap = GUIDES.map(guide => ({
    url: absoluteUrl(`/guides/${guide.slug}`),
    lastModified: new Date(guide.publishedAt),
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  const ipRoutes: MetadataRoute.Sitemap = SEO_IP_SEEDS.map(ip => ({
    url: absoluteUrl(`/ip/${ip}`),
    lastModified,
    changeFrequency: 'weekly',
    priority: 0.75,
  }));

  const asnRoutes: MetadataRoute.Sitemap = ASN_SEEDS.map(asn => ({
    url: absoluteUrl(`/asn/${asn}`),
    lastModified,
    changeFrequency: 'weekly',
    priority: 0.72,
  }));

  const topicRoutes: MetadataRoute.Sitemap = FINGERPRINTING_TOPICS.map(topic => ({
    url: absoluteUrl(`/fingerprinting/${topic.slug}`),
    lastModified,
    changeFrequency: 'monthly',
    priority: 0.78,
  }));

  const comparisonRoutes: MetadataRoute.Sitemap = COMPARISON_PAGES.map(page => ({
    url: absoluteUrl(`/vs/${page.slug}`),
    lastModified,
    changeFrequency: 'monthly',
    priority: 0.74,
  }));

  const taskRoutes: MetadataRoute.Sitemap = ['/ip', '/asn', '/compare', '/privacy'].map(path => ({
    url: absoluteUrl(path),
    changeFrequency: 'monthly',
  }));
  return [...taskRoutes, ...coreRoutes, ...guideRoutes, ...ipRoutes, ...asnRoutes, ...topicRoutes, ...comparisonRoutes];
}
