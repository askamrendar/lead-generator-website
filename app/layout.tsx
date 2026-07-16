import type { Metadata } from 'next';
import './globals.css';
import { business } from '@/data/business';
import { buildRootMetadata } from '@/lib/seo/metadata';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { StickyCallButton } from '@/components/layout/StickyCallButton';
import { SiteChrome } from '@/components/layout/SiteChrome';
import { THEME_INIT_SCRIPT } from '@/components/theme/theme';
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
      <head>
        {/* Apply saved light/dark theme before paint (no flash). */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-dvh flex-col pb-safe-mobile">
        {/* Marketing chrome on public routes; auth/app routes render bare; tenant
            site surfaces (/sites, /hosted) render fully unwrapped. The sample
            business's brand CSS + JSON-LD graph ride the `seo` slot so tenant
            websites never inherit them. */}
        <SiteChrome
          seo={
            <>
              <style dangerouslySetInnerHTML={{ __html: brandCss() }} />
              <JsonLd data={siteGraph} />
            </>
          }
          header={<Header config={business} services={services} cities={cities} />}
          footer={<Footer config={business} services={services} cities={cities} />}
          sticky={<StickyCallButton phone={business.phone} />}
        >
          {children}
        </SiteChrome>
      </body>
    </html>
  );
}
