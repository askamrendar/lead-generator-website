import type { Metadata } from 'next';
import { business } from '@/data/business';
import { buildMetadata } from '@/lib/seo/metadata';
import { getServices, paths } from '@/lib/generator/config';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SectionHeading } from '@/components/site/SectionHeading';
import { ServiceCard } from '@/components/site/ServiceCard';
import { CTASection } from '@/components/site/CTASection';
import { JsonLd } from '@/components/JsonLd';
import { breadcrumbSchema } from '@/lib/seo/schema';

export const metadata: Metadata = buildMetadata({
  config: business,
  title: `${business.category} Services`,
  description: `Explore the full range of ${business.category.toLowerCase()} services from ${business.name}. Upfront pricing, licensed technicians, satisfaction guaranteed.`,
  path: paths.services(),
});

export default function ServicesIndexPage() {
  const services = getServices(business);
  const crumbs = [
    { name: 'Home', path: paths.home() },
    { name: 'Services', path: paths.services() },
  ];

  return (
    <>
      <div className="border-b border-border bg-muted/40">
        <div className="container py-10">
          <Breadcrumbs crumbs={crumbs} />
          <div className="mt-6">
            <SectionHeading
              align="left"
              eyebrow="Our Services"
              title={`Complete ${business.category} Services`}
              description={`${business.name} handles everything from quick repairs to full installations across ${business.address.city} and nearby areas.`}
            />
          </div>
        </div>
      </div>

      <section className="container py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <ServiceCard key={service.slug} service={service} />
          ))}
        </div>
      </section>

      <CTASection config={business} />
      <JsonLd data={breadcrumbSchema(business, crumbs)} />
    </>
  );
}
