import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, Clock, BadgeCheck, ThumbsUp } from 'lucide-react';
import { business } from '@/data/business';
import { buildMetadata } from '@/lib/seo/metadata';
import {
  getCities,
  getServices,
  paths,
  serviceAreaSummary,
} from '@/lib/generator/config';
import { buildHomeContext } from '@/lib/ai/context';
import { resolvePageContent } from '@/lib/ai/render';
import { Hero } from '@/components/site/Hero';
import { Stats } from '@/components/site/Stats';
import { SectionHeading } from '@/components/site/SectionHeading';
import { ServiceCard } from '@/components/site/ServiceCard';
import { LocationCard } from '@/components/site/LocationCard';
import { Reviews } from '@/components/site/Reviews';
import { FAQ } from '@/components/site/FAQ';
import { LeadForm } from '@/components/site/LeadForm';
import { CTASection } from '@/components/site/CTASection';
import { JsonLd } from '@/components/JsonLd';
import { faqSchema } from '@/lib/seo/schema';

export async function generateMetadata(): Promise<Metadata> {
  const { content } = await resolvePageContent(buildHomeContext(business));
  return buildMetadata({
    config: business,
    title: business.name,
    description: content.metaDescription,
    path: '/',
  });
}

const whyUs = [
  { icon: BadgeCheck, title: 'Upfront Pricing', text: 'Flat-rate quotes approved before we start. No surprises.' },
  { icon: ShieldCheck, title: 'Licensed & Insured', text: 'Background-checked pros and code-compliant work every time.' },
  { icon: Clock, title: 'Fast Response', text: 'Same-day availability and 24/7 emergency service.' },
  { icon: ThumbsUp, title: 'Guaranteed Work', text: '100% satisfaction guarantee backing every visit.' },
];

export default async function HomePage() {
  const services = getServices(business);
  const cities = getCities(business);
  const { content } = await resolvePageContent(buildHomeContext(business));
  const homeFaqs = content.faqs;

  return (
    <>
      <Hero
        config={business}
        headline={content.heroHeading}
        subhead={content.heroCopy}
      />

      <Stats config={business} />

      {/* Why choose us */}
      <section className="container py-16">
        <SectionHeading
          eyebrow="Why Choose Us"
          title={`The ${business.category} Team ${business.address.city} Trusts`}
          description={business.description}
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {whyUs.map((item) => (
            <div key={item.title} className="rounded-lg border border-border p-6">
              <span className="flex size-11 items-center justify-center rounded-lg bg-brand/10 text-brand">
                <item.icon className="size-5" />
              </span>
              <h3 className="mt-4 font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm text-muted-fg">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="bg-muted/40 py-16">
        <div className="container">
          <SectionHeading
            eyebrow="Our Services"
            title={`Complete ${business.category} Services`}
            description={`From routine repairs to major installations, ${business.name} does it all — done right and guaranteed.`}
          />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <ServiceCard key={service.slug} service={service} />
            ))}
          </div>
        </div>
      </section>

      {/* Service areas */}
      <section className="container py-16">
        <SectionHeading
          eyebrow="Service Areas"
          title="Proudly Serving Your Neighborhood"
          description={`${business.name} provides ${business.category.toLowerCase()} across ${serviceAreaSummary(business)} and beyond.`}
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cities.map(({ state, city }) => (
            <LocationCard
              key={city.slug}
              name={`${city.name}, ${state.abbr}`}
              href={paths.city(state.slug, city.slug)}
              meta={city.county}
            />
          ))}
        </div>
      </section>

      {/* Reviews */}
      <section className="bg-muted/40 py-16">
        <div className="container">
          <SectionHeading
            eyebrow="Reviews"
            title="What Our Customers Say"
            description={
              business.ratingValue
                ? `Rated ${business.ratingValue}/5 across ${business.ratingCount}+ verified reviews.`
                : undefined
            }
          />
          <div className="mt-10">
            <Reviews reviews={business.reviews} />
          </div>
        </div>
      </section>

      {/* Lead form + FAQ */}
      <section className="container py-16">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Get Started"
              title="Request Your Free Quote"
              description="Tell us what you need and we'll get right back to you with fast scheduling and upfront pricing."
            />
            <div className="mt-8">
              <LeadForm services={services.map((s) => s.name)} />
            </div>
          </div>
          <div>
            <SectionHeading
              align="left"
              eyebrow="FAQ"
              title="Frequently Asked Questions"
            />
            <div className="mt-8">
              <FAQ items={homeFaqs} />
            </div>
            <p className="mt-6 text-sm text-muted-fg">
              Still have questions?{' '}
              <Link href={paths.contact()} className="font-semibold text-brand">
                Contact us
              </Link>{' '}
              — we&rsquo;re happy to help.
            </p>
          </div>
        </div>
      </section>

      <CTASection config={business} />

      <JsonLd data={faqSchema(homeFaqs)} />
    </>
  );
}
