import type { Metadata } from 'next';

/**
 * The intake form is an internal tooling surface, not a marketing page: it has
 * no unique indexable content and posts to `/api/generate`. Mark it `noindex`
 * (mirroring `/preview`) so crawlers don't index a form with no canonical, and
 * so it isn't an SEO orphan (it is intentionally absent from the sitemap).
 */
export const metadata: Metadata = {
  title: 'Generate a Website',
  description: 'Internal intake form for generating a business website.',
  robots: { index: false, follow: false },
};

export default function GenerateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
