import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

const baseUrl = 'https://iphey.org';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
