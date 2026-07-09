import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MapPin } from 'lucide-react';
import { business } from '@/data/business';
import { buildMetadata } from '@/lib/seo/metadata';
import { getServices, getZips, paths } from '@/lib/generator/config';
import { zipLinks } from '@/lib/generator/links';
import { buildZipContext } from '@/lib/ai/context';
import { resolvePageContent } from '@/lib/ai/render';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SectionHeading } from '@/components/site/SectionHeading';
import { ServiceCard } from '@/components/site/ServiceCard';
import { RelatedLinks } from '@/components/site/RelatedLinks';
import { LeadForm } from '@/components/site/LeadForm';
import { MapEmbed } from '@/components/site/MapEmbed';
import { CTASection } from '@/components/site/CTASection';
import { Badge } from '@/components/ui/badge';
import { JsonLd } from '@/components/JsonLd';
import { breadcrumbSchema, graph, placeSchema } from '@/lib/seo/schema';

export function generateStaticParams() {
  return getZips(business).map((z) => ({ zip: z.zip }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ zip: string }>;
}): Promise<Metadata> {
  const { zip } = await params;
  const ctx = buildZipContext(business, zip);
  if (!ctx) return {};
  const target = ctx.zip!;
  const { content } = await resolvePageContent(ctx);
  return buildMetadata({
    config: business,
    title: `${business.primaryService} in ${target.zip} — ${target.city.name}`,
    description: content.metaDescription,
    path: ctx.path,
    geo:
      target.city.lat && target.city.lng
        ? {
            lat: target.city.lat,
            lng: target.city.lng,
            placename: `${target.city.name}, ${target.state.abbr} ${target.zip}`,
            region: `US-${target.state.abbr}`,
          }
        : undefined,
  });
}

export default async function ZipPage({
  params,
}: {
  params: Promise<{ zip: string }>;
}) {
  const { zip } = await params;
  const ctx = buildZipContext(business, zip);
  if (!ctx) notFound();

  const target = ctx.zip!;
  const { content } = await resolvePageContent(ctx);
  const services = getServices(business);
  const crumbs = [
    { name: 'Home', path: paths.home() },
    { name: 'Service Areas', path: paths.locations() },
    { name: target.state.name, path: paths.stateHub(target.state.slug) },
    {
      name: `${target.city.name}, ${target.state.abbr}`,
      path: paths.city(target.state.slug, target.city.slug),
    },
    { name: target.zip, path: paths.zip(target.zip) },
  ];

  return (
    <>
      <section className="border-b border-border bg-gradient-to-b from-muted/60 to-background">
        <div className="container grid gap-10 py-12 lg:grid-cols-[1.4fr_1fr] lg:items-start lg:py-16">
          <div>
            <Breadcrumbs crumbs={crumbs} />
            <Badge variant="brand" className="mt-4">
              <MapPin className="size-3.5" /> {target.city.name}, {target.state.abbr}
            </Badge>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
              {business.primaryService} in {target.zip}
            </h1>
            <p className="speakable-intro mt-5 max-w-xl text-lg text-muted-fg">
              {content.intro}
            </p>
          </div>
          <div className="lg:sticky lg:top-24">
            <LeadForm
              title={`Service in ${target.zip}`}
              services={services.map((s) => s.name)}
            />
          </div>
        </div>
      </section>

      <section className="container py-16">
        <SectionHeading
          eyebrow="Local Services"
          title={`${business.category} Services in ${target.zip}`}
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <ServiceCard key={service.slug} service={service} />
          ))}
        </div>
      </section>

      <section className="bg-muted/40 py-16">
        <div className="container grid gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <SectionHeading align="left" eyebrow="Explore" title="Related Pages" />
            <RelatedLinks className="mt-8" clusters={zipLinks(business, target)} />
          </div>
          <MapEmbed
            query={`${target.zip} ${target.city.name} ${target.state.abbr}`}
            title={`Map of ${target.zip}`}
          />
        </div>
      </section>

      <CTASection
        config={business}
        title={`Need ${business.category} in ${target.zip}?`}
      />

      <JsonLd
        data={graph([
          placeSchema(business, {
            type: 'PostalCodeArea',
            name: `${target.city.name} ${target.zip}`,
            url: paths.zip(target.zip),
            postalCode: target.zip,
            containedIn: target.city.name,
            lat: target.city.lat,
            lng: target.city.lng,
          }),
          breadcrumbSchema(business, crumbs),
        ])}
      />
    </>
  );
}
