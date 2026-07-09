import type { Metadata } from 'next';
import { business } from '@/data/business';
import { buildMetadata } from '@/lib/seo/metadata';
import { getStates, paths, citySlug } from '@/lib/generator/config';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SectionHeading } from '@/components/site/SectionHeading';
import { LocationCard } from '@/components/site/LocationCard';
import { CTASection } from '@/components/site/CTASection';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbSchema } from '@/lib/seo/schema';

export const metadata: Metadata = buildMetadata({
  config: business,
  title: 'Service Areas',
  description: `${business.name} provides ${business.category.toLowerCase()} across ${business.states
    .map((s) => s.name)
    .join(', ')}. Find your city and get fast, local service.`,
  path: paths.locations(),
});

export default function LocationsHubPage() {
  const states = getStates(business);
  const crumbs = [
    { name: 'Home', path: paths.home() },
    { name: 'Service Areas', path: paths.locations() },
  ];

  return (
    <>
      <div className="border-b border-border bg-muted/40">
        <div className="container py-10">
          <Breadcrumbs crumbs={crumbs} />
          <div className="mt-6">
            <SectionHeading
              align="left"
              eyebrow="Service Areas"
              title="Where We Work"
              description={`${business.name} proudly serves communities throughout ${business.states
                .map((s) => s.name)
                .join(', ')}.`}
            />
          </div>
        </div>
      </div>

      <section className="container space-y-12 py-16">
        {states.map((state) => (
          <div key={state.slug}>
            <h2 className="text-2xl font-bold">{state.name}</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {state.cities.map((city) => (
                <LocationCard
                  key={citySlug(city)}
                  name={`${city.name}, ${state.abbr}`}
                  href={paths.city(state.slug, citySlug(city))}
                  meta={
                    city.county
                      ? `${city.county}${city.zips.length ? ` · ${city.zips.length} ZIP codes` : ''}`
                      : undefined
                  }
                />
              ))}
            </div>
          </div>
        ))}
      </section>

      <CTASection config={business} />
      <JsonLd data={breadcrumbSchema(business, crumbs)} />
    </>
  );
}
