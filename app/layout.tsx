import type { Metadata } from 'next';
import './globals.css';
import { business } from '@/data/business';
import { buildRootMetadata } from '@/lib/seo/metadata';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { StickyCallButton } from '@/components/layout/StickyCallButton';
import { JsonLd } from '@/components/seo/JsonLd';
import { getCities, getServices, paths } from '@/lib/generator/config';
import {
  graph,
  localBusinessSchema,
  organizationSchema,
  websiteSchema,
} from '@/lib/seo/schema';

export const metadata: Metadata = buildRootMetadata(business);

/**
 * Brand theming: inject the business's brand colors as CSS variables so the
 * entire generated site themes itself from the config. Server-rendered inline
 * so there is no flash of default colors.
 */
function brandCss(): string {
  const b = business.brand;
  return `:root{--brand:${b.primary};--brand-fg:${b.primaryForeground};--accent:${b.accent};--accent-fg:${b.accentForeground};--radius:${b.radius};}`;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const services = getServices(business);
  const cities = getCities(business).map(({ state, city }) => ({
    name: `${city.name}, ${state.abbr}`,
    href: paths.city(state.slug, city.slug),
  }));

  const siteGraph = graph([
    organizationSchema(business),
    websiteSchema(business),
    localBusinessSchema(business),
  ]);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-dvh flex-col pb-safe-mobile">
        {/* Brand theming injected from the business config. */}
        <style dangerouslySetInnerHTML={{ __html: brandCss() }} />
        <JsonLd data={siteGraph} />
        <Header config={business} services={services} cities={cities} />
        <main className="flex-1">{children}</main>
        <Footer config={business} services={services} cities={cities} />
        <StickyCallButton phone={business.phone} />
      </body>
    </html>
  );
}
