import type { MetadataRoute } from 'next';
import { business } from '@/data/business';

/** PWA manifest, themed from the business brand's primary color. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: business.name,
    short_name: business.logoText ?? business.name,
    description: business.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: `hsl(${business.brand.primary})`,
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
