import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Check, Phone, MapPin } from 'lucide-react';
import { business } from '@/data/business';
import { buildMetadata } from '@/lib/seo/metadata';
import {
  getServiceCityMatrix,
  getServices,
  paths,
} from '@/lib/generator/config';
import { serviceCityLinks } from '@/lib/generator/links';
import { buildServiceCityContext } from '@/lib/ai/context';
import { resolvePageContent } from '@/lib/ai/render';
import { formatPhone, telHref } from '@/lib/utils';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SectionHeading } from '@/components/site/SectionHeading';
import { StatBar } from '@/components/site/StatBar';
import { CommonProblems } from '@/components/site/CommonProblems';
import { EmergencyCTA } from '@/components/site/EmergencyCTA';
import { FAQ } from '@/components/site/FAQ';
import { LeadForm } from '@/components/site/LeadForm';
import { MapEmbed } from '@/components/site/MapEmbed';
import { RelatedLinks } from '@/components/site/RelatedLinks';
import { CTASection } from '@/components/site/CTASection';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { JsonLd } from '@/components/JsonLd';
import {
  breadcrumbSchema,
  faqSchema,
  graph,
  serviceInCitySchema,
  speakableSchema,
} from '@/lib/seo/schema';

// Incremental Static Regeneration: prerender the demo matrix, regenerate daily,
// and render any unlisted service×city combo on demand (dynamicParams default).
export const revalidate = 86400;

export function generateStaticParams() {
  return getServiceCityMatrix(business).map(({ service, state, city }) => ({
    slug: service.slug,
    state: state.slug,
    city: city.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; state: string; city: string }>;
}): Promise<Metadata> {
  const { slug, state, city } = await params;
  const ctx = buildServiceCityContext(business, slug, state, city);
  if (!ctx) return {};
  const { content } = await resolvePageContent(ctx);
  const svc = ctx.service!;
  const ct = ctx.city!;
  const st = ctx.state!;
  return buildMetadata({
    config: business,
    title: content.seoTitle,
    description: content.metaDescription,
    path: ctx.path,
    image: svc.image,
    geo:
      ct.lat && ct.lng
        ? {
            lat: ct.lat,
            lng: ct.lng,
            placename: `${ct.name}, ${st.abbr}`,
            region: `US-${st.abbr}`,
          }
        : undefined,
    keywords: [
      `${svc.name.toLowerCase()} ${ct.name.toLowerCase()}`,
      svc.keyword ?? '',
      `${business.category.toLowerCase()} ${ct.name.toLowerCase()}`,
    ].filter(Boolean),
  });
}

export default async function ServiceCityPage({
  params,
}: {
  params: Promise<{ slug: string; state: string; city: string }>;
}) {
  const { slug, state, city } = await params;
  const ctx = buildServiceCityContext(business, slug, state, city);
  if (!ctx) notFound();

  const service = ctx.service!;
  const st = ctx.state!;
  const ct = ctx.city!;
  const { content } = await resolvePageContent(ctx);
  const benefits = content.benefits;
  const faqs = content.faqs;
  const problems = content.problems;
  const stats = content.stats;
  const emergency = content.emergency;
  const path = ctx.path;

  const crumbs = [
    { name: 'Home', path: paths.home() },
    { name: 'Services', path: paths.services() },
    { name: service.name, path: paths.service(service.slug) },
    { name: `${ct.name}, ${st.abbr}`, path },
  ];

  return (
    <>
      <section className="border-b border-border bg-gradient-to-b from-muted/60 to-background">
        <div className="container grid gap-10 py-12 lg:grid-cols-[1.4fr_1fr] lg:items-start lg:py-16">
          <div>
            <Breadcrumbs crumbs={crumbs} />
            <Badge variant={service.emergency ? 'accent' : 'brand'} className="mt-4">
              <MapPin className="size-3.5" /> {ct.name}, {st.abbr}
            </Badge>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
              {content.heroHeading}
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
                <a href="#quote">Get a Free Quote</a>
              </Button>
            </div>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {benefits.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-brand" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <div id="quote" className="lg:sticky lg:top-24">
            <LeadForm
              title={`${service.name} in ${ct.name}`}
              services={getServices(business).map((s) => s.name)}
            />
          </div>
        </div>
      </section>

      <StatBar stats={stats} />

      {service.emergency && emergency && (
        <EmergencyCTA
          title={emergency.title}
          description={emergency.description}
          phone={business.phone}
        />
      )}

      <section className="container py-16">
        <SectionHeading
          eyebrow="Why Choose Us"
          title={`Common ${service.name} Problems We Solve in ${ct.name}`}
          description={`Here's how ${business.name} handles the issues ${ct.name} homeowners run into most.`}
        />
        <div className="mt-10">
          <CommonProblems items={problems} />
        </div>
      </section>

      <section className="bg-muted/40 py-16">
        <div className="container">
          <SectionHeading
            eyebrow="FAQ"
            title={`${service.name} in ${ct.name} — FAQs`}
          />
          <div className="mt-10">
            <FAQ items={faqs} />
          </div>
        </div>
      </section>

      <section className="container py-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <SectionHeading align="left" eyebrow="Explore" title="Related Pages" />
            <RelatedLinks
              className="mt-8"
              clusters={serviceCityLinks(business, service, st, ct)}
            />
          </div>
          <MapEmbed
            query={`${ct.name}, ${st.abbr}`}
            title={`Map of ${ct.name}, ${st.abbr}`}
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
          serviceInCitySchema(business, service, ct, st.abbr),
          faqSchema(faqs),
          speakableSchema(business, path),
          breadcrumbSchema(business, crumbs),
        ])}
      />
    </>
  );
}
