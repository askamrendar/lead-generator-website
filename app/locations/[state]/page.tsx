import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { business } from '@/data/business';
import { buildMetadata } from '@/lib/seo/metadata';
import { citySlug, getCounties, getStates, paths } from '@/lib/generator/config';
import { buildStateContext } from '@/lib/ai/context';
import { resolvePageContent } from '@/lib/ai/render';
import { stateLinks } from '@/lib/generator/links';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SectionHeading } from '@/components/site/SectionHeading';
import { LocationCard } from '@/components/site/LocationCard';
import { RelatedLinks } from '@/components/site/RelatedLinks';
import { CTASection } from '@/components/site/CTASection';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbSchema, graph, placeSchema } from '@/lib/seo/schema';

export function generateStaticParams() {
  return getStates(business).map((s) => ({ state: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string }>;
}): Promise<Metadata> {
  const { state } = await params;
  const ctx = buildStateContext(business, state);
  if (!ctx) return {};
  const { content } = await resolvePageContent(ctx);
  return buildMetadata({
    config: business,
    title: `${business.category} in ${ctx.state!.name}`,
    description: content.metaDescription,
    path: ctx.path,
  });
}

export default async function StateHubPage({
  params,
}: {
  params: Promise<{ state: string }>;
}) {
  const { state: stateParam } = await params;
  const ctx = buildStateContext(business, stateParam);
  if (!ctx) notFound();

  const state = ctx.state!;
  const { content } = await resolvePageContent(ctx);
  const counties = getCounties(business).filter(
    (c) => c.state.slug === state.slug,
  );
  const crumbs = [
    { name: 'Home', path: paths.home() },
    { name: 'Service Areas', path: paths.locations() },
    { name: state.name, path: paths.stateHub(state.slug) },
  ];

  return (
    <>
      <div className="border-b border-border bg-muted/40">
        <div className="container py-10">
          <Breadcrumbs crumbs={crumbs} />
          <div className="mt-6">
            <SectionHeading
              align="left"
              eyebrow="Service Area"
              title={`${business.category} Across ${state.name}`}
            />
            <p className="speakable-intro mt-4 max-w-2xl text-lg text-muted-fg">
              {content.intro}
            </p>
          </div>
        </div>
      </div>

      <section className="container py-16">
        <h2 className="text-2xl font-bold">Cities We Serve in {state.name}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {state.cities.map((city) => (
            <LocationCard
              key={citySlug(city)}
              name={`${city.name}, ${state.abbr}`}
              href={paths.city(state.slug, citySlug(city))}
              meta={city.county}
            />
          ))}
        </div>

        {counties.length > 0 && (
          <>
            <h2 className="mt-14 text-2xl font-bold">Counties</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {counties.map((c) => (
                <LocationCard
                  key={c.slug}
                  name={c.name}
                  href={paths.county(state.slug, c.slug)}
                  meta={`${c.cities.length} ${c.cities.length === 1 ? 'city' : 'cities'}`}
                />
              ))}
            </div>
          </>
        )}
      </section>

      <section className="bg-muted/40 py-16">
        <div className="container">
          <SectionHeading align="left" eyebrow="Explore" title="Related Pages" />
          <RelatedLinks className="mt-8" clusters={stateLinks(business, state)} />
        </div>
      </section>

      <CTASection config={business} />

      <JsonLd
        data={graph([
          placeSchema(business, {
            type: 'AdministrativeArea',
            name: state.name,
            url: paths.stateHub(state.slug),
          }),
          breadcrumbSchema(business, crumbs),
        ])}
      />
    </>
  );
}
