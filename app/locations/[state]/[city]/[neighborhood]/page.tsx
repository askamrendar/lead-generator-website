import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MapPin } from 'lucide-react';
import { business } from '@/data/business';
import { buildMetadata } from '@/lib/seo/metadata';
import {
  getNeighborhoods,
  getServices,
  paths,
} from '@/lib/generator/config';
import { neighborhoodLinks } from '@/lib/generator/links';
import { buildNeighborhoodContext } from '@/lib/ai/context';
import { resolvePageContent } from '@/lib/ai/render';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SectionHeading } from '@/components/site/SectionHeading';
import { ServiceCard } from '@/components/site/ServiceCard';
import { RelatedLinks } from '@/components/site/RelatedLinks';
import { LeadForm } from '@/components/forms/LeadForm';
import { CTASection } from '@/components/site/CTASection';
import { Badge } from '@/components/ui/badge';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbSchema, graph, placeSchema } from '@/lib/seo/schema';

export function generateStaticParams() {
  return getNeighborhoods(business).map((n) => ({
    state: n.state.slug,
    city: n.city.slug,
    neighborhood: n.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string; city: string; neighborhood: string }>;
}): Promise<Metadata> {
  const { state, city, neighborhood } = await params;
  const ctx = buildNeighborhoodContext(business, state, city, neighborhood);
  if (!ctx) return {};
  const n = ctx.neighborhood!;
  const { content } = await resolvePageContent(ctx);
  return buildMetadata({
    config: business,
    title: `${business.primaryService} in ${n.name}, ${n.city.name}`,
    description: content.metaDescription,
    path: ctx.path,
    geo:
      n.city.lat && n.city.lng
        ? {
            lat: n.city.lat,
            lng: n.city.lng,
            placename: `${n.name}, ${n.city.name}, ${n.state.abbr}`,
            region: `US-${n.state.abbr}`,
          }
        : undefined,
  });
}

export default async function NeighborhoodPage({
  params,
}: {
  params: Promise<{ state: string; city: string; neighborhood: string }>;
}) {
  const { state, city, neighborhood } = await params;
  const ctx = buildNeighborhoodContext(business, state, city, neighborhood);
  if (!ctx) notFound();

  const n = ctx.neighborhood!;
  const { content } = await resolvePageContent(ctx);
  const services = getServices(business);
  const crumbs = [
    { name: 'Home', path: paths.home() },
    { name: 'Service Areas', path: paths.locations() },
    { name: n.state.name, path: paths.stateHub(n.state.slug) },
    { name: `${n.city.name}, ${n.state.abbr}`, path: paths.city(n.state.slug, n.city.slug) },
    { name: n.name, path: paths.neighborhood(n.state.slug, n.city.slug, n.slug) },
  ];

  return (
    <>
      <section className="border-b border-border bg-gradient-to-b from-muted/60 to-background">
        <div className="container grid gap-10 py-12 lg:grid-cols-[1.4fr_1fr] lg:items-start lg:py-16">
          <div>
            <Breadcrumbs crumbs={crumbs} />
            <Badge variant="brand" className="mt-4">
              <MapPin className="size-3.5" /> {n.city.name}, {n.state.abbr}
            </Badge>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
              {business.primaryService} in {n.name}
            </h1>
            <p className="speakable-intro mt-5 max-w-xl text-lg text-muted-fg">
              {content.intro}
            </p>
          </div>
          <div className="lg:sticky lg:top-24">
            <LeadForm
              title={`Book Service in ${n.name}`}
              services={services.map((s) => s.name)}
            />
          </div>
        </div>
      </section>

      <section className="container py-16">
        <SectionHeading
          eyebrow="Local Services"
          title={`${business.category} Services in ${n.name}`}
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <ServiceCard key={service.slug} service={service} />
          ))}
        </div>
      </section>

      <section className="bg-muted/40 py-16">
        <div className="container">
          <SectionHeading align="left" eyebrow="Explore" title="Related Pages" />
          <RelatedLinks className="mt-8" clusters={neighborhoodLinks(business, n)} />
        </div>
      </section>

      <CTASection
        config={business}
        title={`Need ${business.category} in ${n.name}?`}
      />

      <JsonLd
        data={graph([
          placeSchema(business, {
            type: 'Place',
            name: `${n.name}, ${n.city.name}`,
            url: paths.neighborhood(n.state.slug, n.city.slug, n.slug),
            containedIn: n.city.name,
            lat: n.city.lat,
            lng: n.city.lng,
          }),
          breadcrumbSchema(business, crumbs),
        ])}
      />
    </>
  );
}
