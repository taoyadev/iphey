import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

const baseUrl = 'https://iphey.org';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: `${baseUrl}/`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/docs`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/api-reference`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/leaks`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
  ];
}
