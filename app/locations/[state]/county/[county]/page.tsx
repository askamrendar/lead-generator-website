import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { business } from '@/data/business';
import { buildMetadata } from '@/lib/seo/metadata';
import { getCounties, paths } from '@/lib/generator/config';
import { countyLinks } from '@/lib/generator/links';
import { buildCountyContext } from '@/lib/ai/context';
import { resolvePageContent } from '@/lib/ai/render';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SectionHeading } from '@/components/site/SectionHeading';
import { LocationCard } from '@/components/site/LocationCard';
import { RelatedLinks } from '@/components/site/RelatedLinks';
import { CTASection } from '@/components/site/CTASection';
import { JsonLd } from '@/components/JsonLd';
import { breadcrumbSchema, graph, placeSchema } from '@/lib/seo/schema';

export function generateStaticParams() {
  return getCounties(business).map((c) => ({
    state: c.state.slug,
    county: c.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string; county: string }>;
}): Promise<Metadata> {
  const { state, county } = await params;
  const ctx = buildCountyContext(business, state, county);
  if (!ctx) return {};
  const { content } = await resolvePageContent(ctx);
  return buildMetadata({
    config: business,
    title: `${business.primaryService} in ${ctx.county!.name}`,
    description: content.metaDescription,
    path: ctx.path,
  });
}

export default async function CountyHubPage({
  params,
}: {
  params: Promise<{ state: string; county: string }>;
}) {
  const { state: stateParam, county: countyParam } = await params;
  const ctx = buildCountyContext(business, stateParam, countyParam);
  if (!ctx) notFound();

  const county = ctx.county!;
  const { content } = await resolvePageContent(ctx);
  const crumbs = [
    { name: 'Home', path: paths.home() },
    { name: 'Service Areas', path: paths.locations() },
    { name: county.state.name, path: paths.stateHub(county.state.slug) },
    { name: county.name, path: paths.county(county.state.slug, county.slug) },
  ];

  return (
    <>
      <div className="border-b border-border bg-muted/40">
        <div className="container py-10">
          <Breadcrumbs crumbs={crumbs} />
          <div className="mt-6">
            <SectionHeading
              align="left"
              eyebrow="County"
              title={`${business.category} in ${county.name}`}
            />
            <p className="speakable-intro mt-4 max-w-2xl text-lg text-muted-fg">
              {content.intro}
            </p>
          </div>
        </div>
      </div>

      <section className="container py-16">
        <h2 className="text-2xl font-bold">Cities in {county.name}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {county.cities.map((city) => (
            <LocationCard
              key={city.slug}
              name={`${city.name}, ${county.state.abbr}`}
              href={paths.city(county.state.slug, city.slug)}
              meta={city.zips.length ? `${city.zips.length} ZIP codes` : undefined}
            />
          ))}
        </div>
      </section>

      <section className="bg-muted/40 py-16">
        <div className="container">
          <SectionHeading align="left" eyebrow="Explore" title="Related Pages" />
          <RelatedLinks className="mt-8" clusters={countyLinks(business, county)} />
        </div>
      </section>

      <CTASection
        config={business}
        title={`Need ${business.category} in ${county.name}?`}
      />

      <JsonLd
        data={graph([
          placeSchema(business, {
            type: 'AdministrativeArea',
            name: county.name,
            url: paths.county(county.state.slug, county.slug),
            containedIn: county.state.name,
          }),
          breadcrumbSchema(business, crumbs),
        ])}
      />
    </>
  );
}
