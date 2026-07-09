import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Check, ArrowRight, Phone } from 'lucide-react';
import { business } from '@/data/business';
import { buildMetadata } from '@/lib/seo/metadata';
import { getCities, getServices, paths } from '@/lib/generator/config';
import { buildServiceContext } from '@/lib/ai/context';
import { resolvePageContent } from '@/lib/ai/render';
import { formatPhone, telHref } from '@/lib/utils';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SectionHeading } from '@/components/site/SectionHeading';
import { FAQ } from '@/components/site/FAQ';
import { LeadForm } from '@/components/forms/LeadForm';
import { LocationCard } from '@/components/site/LocationCard';
import { RelatedLinks } from '@/components/site/RelatedLinks';
import { CTASection } from '@/components/site/CTASection';
import { serviceLinks } from '@/lib/generator/links';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  breadcrumbSchema,
  faqSchema,
  graph,
  serviceSchema,
} from '@/lib/seo/schema';

export function generateStaticParams() {
  return getServices(business).map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const ctx = buildServiceContext(business, slug);
  if (!ctx) return {};
  const { content } = await resolvePageContent(ctx);
  return buildMetadata({
    config: business,
    title: `${ctx.service!.name} in ${business.address.city}`,
    description: content.metaDescription,
    path: ctx.path,
    image: ctx.service!.image,
  });
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ctx = buildServiceContext(business, slug);
  if (!ctx) notFound();

  const service = ctx.service!;
  const { content } = await resolvePageContent(ctx);
  const benefits = content.benefits;
  const process = content.process;
  const faqs = content.faqs;
  const related = getServices(business)
    .filter((s) => s.slug !== service.slug)
    .slice(0, 3);
  const cities = getCities(business).slice(0, 6);

  const crumbs = [
    { name: 'Home', path: paths.home() },
    { name: 'Services', path: paths.services() },
    { name: service.name, path: paths.service(service.slug) },
  ];

  return (
    <>
      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-b from-muted/60 to-background">
        <div className="container grid gap-10 py-12 lg:grid-cols-[1.4fr_1fr] lg:items-start lg:py-16">
          <div>
            <Breadcrumbs crumbs={crumbs} />
            {service.emergency && (
              <Badge variant="accent" className="mt-4">
                24/7 Emergency Service
              </Badge>
            )}
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
                <Link href={paths.contact()}>Get a Free Quote</Link>
              </Button>
            </div>
          </div>

          <div className="lg:sticky lg:top-24">
            <LeadForm
              title={`Request ${service.name}`}
              services={getServices(business).map((s) => s.name)}
            />
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="container py-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Why Choose Us"
              title={`Professional ${service.name} You Can Trust`}
              description={service.shortDescription}
            />
            <ul className="mt-6 space-y-3">
              {benefits.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                    <Check className="size-4" />
                  </span>
                  <span className="text-foreground">{b}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-muted/40 p-8">
            <h3 className="text-lg font-semibold">
              {business.name} at a glance
            </h3>
            <dl className="mt-4 space-y-3 text-sm">
              {business.yearsInBusiness && (
                <Row label="Experience" value={`${business.yearsInBusiness}+ years`} />
              )}
              {business.ratingValue && (
                <Row
                  label="Rating"
                  value={`${business.ratingValue}/5 (${business.ratingCount}+ reviews)`}
                />
              )}
              {service.startingPrice && (
                <Row label="Starting at" value={service.startingPrice} />
              )}
              <Row label="Service area" value={`${business.serviceRadiusMiles} mile radius`} />
              <Row label="Guarantee" value="100% satisfaction" />
            </dl>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="bg-muted/40 py-16">
        <div className="container">
          <SectionHeading
            eyebrow="Our Process"
            title="How It Works"
            description={`Getting your ${service.name.toLowerCase()} handled is simple and stress-free.`}
          />
          <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {process.map((step, i) => (
              <li key={step.title} className="rounded-lg border border-border bg-background p-6">
                <span className="flex size-9 items-center justify-center rounded-full bg-brand font-bold text-brand-fg">
                  {i + 1}
                </span>
                <h3 className="mt-4 font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-muted-fg">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section className="container py-16">
        <SectionHeading eyebrow="FAQ" title={`${service.name} Questions, Answered`} />
        <div className="mt-10">
          <FAQ items={faqs} />
        </div>
      </section>

      {/* Related services */}
      <section className="bg-muted/40 py-16">
        <div className="container">
          <SectionHeading align="left" eyebrow="Related Services" title="You Might Also Need" />
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={paths.service(r.slug)}
                className="group flex items-center justify-between rounded-lg border border-border bg-background p-5 hover:shadow-md"
              >
                <span className="font-semibold">{r.name}</span>
                <ArrowRight className="size-4 text-muted-fg transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>

          <h3 className="mt-12 text-lg font-semibold">
            {service.name} by Location
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cities.map(({ state, city }) => (
              <LocationCard
                key={city.slug}
                name={`${service.name} in ${city.name}`}
                href={paths.city(state.slug, city.slug)}
                meta={`${city.name}, ${state.abbr}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border py-16">
        <div className="container">
          <SectionHeading align="left" eyebrow="Explore" title="Related Pages" />
          <RelatedLinks className="mt-8" clusters={serviceLinks(business, service)} />
        </div>
      </section>

      <CTASection
        config={business}
        title={content.cta.title}
        description={content.cta.description}
      />

      <JsonLd
        data={graph([
          serviceSchema(business, service),
          breadcrumbSchema(business, crumbs),
          faqSchema(faqs),
        ])}
      />
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border pb-2 last:border-0 last:pb-0">
      <dt className="text-muted-fg">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
