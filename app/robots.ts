import type { MetadataRoute } from 'next';
import { business } from '@/data/business';
import { absoluteUrl } from '@/lib/generator/config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/'],
    },
    sitemap: absoluteUrl(business, '/sitemap.xml'),
    host: business.siteUrl,
  };
}
