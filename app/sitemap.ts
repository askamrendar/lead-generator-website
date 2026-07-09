import type { MetadataRoute } from 'next';
import { business } from '@/data/business';
import { absoluteUrl, getAllPaths } from '@/lib/generator/config';

export default function sitemap(): MetadataRoute.Sitemap {
  return getAllPaths(business).map((path) => ({
    url: absoluteUrl(business, path),
    changeFrequency: path === '/' ? 'weekly' : 'monthly',
    priority: path === '/' ? 1 : path.split('/').length > 2 ? 0.6 : 0.8,
  }));
}
