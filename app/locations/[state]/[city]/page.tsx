import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Check, Phone, MapPin } from 'lucide-react';
import { business } from '@/data/business';
import { buildMetadata } from '@/lib/seo/metadata';
import {
  getCities,
  getNearbyCities,
  getServices,
  paths,
} from '@/lib/generator/config';
import { locationWhyLocal } from '@/lib/generator/content';
import { buildCityContext } from '@/lib/ai/context';
import { resolvePageContent } from '@/lib/ai/render';
import { formatPhone, telHref } from '@/lib/utils';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SectionHeading } from '@/components/site/SectionHeading';
import { ServiceCard } from '@/components/site/ServiceCard';
import { LocationCard } from '@/components/site/LocationCard';
import { LeadForm } from '@/components/site/LeadForm';
import { Reviews } from '@/components/site/Reviews';
import { RelatedLinks } from '@/components/site/RelatedLinks';
import { CTASection } from '@/components/site/CTASection';
import { MapEmbed } from '@/components/site/MapEmbed';
import { cityLinks } from '@/lib/generator/links';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { JsonLd } from '@/components/JsonLd';
import {
  breadcrumbSchema,
  graph,
  locationServiceSchema,
} from '@/lib/seo/schema';

export function generateStaticParams() {
  return getCities(business).map(({ state, city }) => ({
    state: state.slug,
    city: city.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string; city: string }>;
}): Promise<Metadata> {
  const { state, city } = await params;
  const ctx = buildCityContext(business, state, city);
  if (!ctx) return {};
  const { content } = await resolvePageContent(ctx);
  return buildMetadata({
    config: business,
    title: `${business.primaryService} in ${ctx.city!.name}, ${ctx.state!.abbr}`,
    description: content.metaDescription,
    path: ctx.path,
    geo:
      ctx.city!.lat && ctx.city!.lng
        ? {
            lat: ctx.city!.lat,
            lng: ctx.city!.lng,
            placename: `${ctx.city!.name}, ${ctx.state!.abbr}`,
            region: `US-${ctx.state!.abbr}`,
          }
        : undefined,
  });
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ state: string; city: string }>;
}) {
  const { state: stateParam, city: cityParam } = await params;
  const ctx = buildCityContext(business, stateParam, cityParam);
  if (!ctx) notFound();

  const state = ctx.state!;
  const city = ctx.city!;
  const { content } = await resolvePageContent(ctx);
  const services = getServices(business);
  const nearby = getNearbyCities(business, state.slug, city.slug);
  const whyLocal = locationWhyLocal(business, city);

  const crumbs = [
    { name: 'Home', path: paths.home() },
    { name: 'Service Areas', path: paths.locations() },
    { name: `${city.name}, ${state.abbr}`, path: paths.city(state.slug, city.slug) },
  ];

  return (
    <>
      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-b from-muted/60 to-background">
        <div className="container grid gap-10 py-12 lg:grid-cols-[1.4fr_1fr] lg:items-start lg:py-16">
          <div>
            <Breadcrumbs crumbs={crumbs} />
            <Badge variant="brand" className="mt-4">
              <MapPin className="size-3.5" /> {city.county ?? `${city.name} Area`}
            </Badge>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
              {business.primaryService} in {city.name}, {state.abbr}
            </h1>
            <p className="speakable-intro mt-5 max-w-xl text-lg text-muted-fg">
              {content.intro}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="accent">
                <a href={telHref(business.phone)}>
                  <Phone className="size-5" /> Call {formatPhone(business.phone)}
                </a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href={paths.contact()}>Get a Free Quote</Link>
              </Button>
            </div>

            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {whyLocal.map((w) => (
                <li key={w} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-brand" />
                  {w}
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:sticky lg:top-24">
            <LeadForm
              title={`Book Service in ${city.name}`}
              services={services.map((s) => s.name)}
            />
          </div>
        </div>
      </section>

      {/* Services offered here */}
      <section className="container py-16">
        <SectionHeading
          eyebrow="Local Services"
          title={`${business.category} Services in ${city.name}`}
          description={`Everything ${business.name} offers is available throughout ${city.name} and nearby neighborhoods.`}
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <ServiceCard key={service.slug} service={service} />
          ))}
        </div>
      </section>

      {/* Coverage: ZIPs + neighborhoods + map */}
      <section className="bg-muted/40 py-16">
        <div className="container grid gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Coverage"
              title={`Serving All of ${city.name}`}
              description={`Local crews respond quickly across ${city.name}.`}
            />
            {city.neighborhoods.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-fg">
                  Neighborhoods
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {city.neighborhoods.map((n) => (
                    <span
                      key={n}
                      className="rounded-full border border-border bg-background px-3 py-1 text-sm"
                    >
                      {n}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {city.zips.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-fg">
                  ZIP Codes
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {city.zips.map((z) => (
                    <span
                      key={z}
                      className="rounded-full border border-border bg-background px-3 py-1 text-sm"
                    >
                      {z}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <MapEmbed
            query={`${city.name}, ${state.abbr}`}
            title={`Map of ${city.name}, ${state.abbr}`}
          />
        </div>
      </section>

      {/* Reviews */}
      {business.reviews.length > 0 && (
        <section className="container py-16">
          <SectionHeading eyebrow="Reviews" title={`Trusted by ${city.name} Homeowners`} />
          <div className="mt-10">
            <Reviews reviews={business.reviews} />
          </div>
        </section>
      )}

      {/* Nearby areas */}
      {nearby.length > 0 && (
        <section className="bg-muted/40 py-16">
          <div className="container">
            <SectionHeading align="left" eyebrow="Nearby Areas" title="We Also Serve" />
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {nearby.map((n) => (
                <LocationCard
                  key={n.slug}
                  name={`${n.name}, ${state.abbr}`}
                  href={paths.city(state.slug, n.slug)}
                  meta={n.county}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="border-t border-border py-16">
        <div className="container">
          <SectionHeading align="left" eyebrow="Explore" title="Related Pages" />
          <RelatedLinks
            className="mt-8"
            clusters={cityLinks(business, state, city)}
          />
        </div>
      </section>

      <CTASection
        config={business}
        title={content.cta.title}
        description={content.cta.description}
      />

      <JsonLd
        data={graph([
          locationServiceSchema(business, city),
          breadcrumbSchema(business, crumbs),
        ])}
      />
    </>
  );
}
