import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ServiceCard } from '@/components/site/ServiceCard';
import { LocationCard } from '@/components/site/LocationCard';
import { FAQ } from '@/components/site/FAQ';
import { LeadForm } from '@/components/forms/LeadForm';
import { MapEmbed } from '@/components/site/MapEmbed';
import { CTASection } from '@/components/site/CTASection';
import { EmergencyCTA } from '@/components/site/EmergencyCTA';
import { SectionHeading } from '@/components/site/SectionHeading';
import { paths } from '@/lib/generator/config';
import type { BlockProps } from '@/lib/builder/types';
import type { LinkAnchor } from '@/lib/ai/types';

function str(config: Record<string, unknown>, key: string, fallback = ''): string {
  const v = config[key];
  return typeof v === 'string' ? v : fallback;
}
function num(config: Record<string, unknown>, key: string, fallback: number): number {
  const v = config[key];
  return typeof v === 'number' ? v : fallback;
}

export function ServiceGridBlock({ ctx, config }: BlockProps) {
  const items = ctx.services.slice(0, num(config, 'limit', ctx.services.length));
  return (
    <section className="bg-muted/40 py-16">
      <div className="container">
        <SectionHeading
          eyebrow={str(config, 'eyebrow', 'Our Services')}
          title={str(config, 'title', `Complete ${ctx.business.category} Services`)}
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((s) => (
            <ServiceCard key={s.slug} service={s} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function LocationGridBlock({ ctx, config }: BlockProps) {
  const items = ctx.cities.slice(0, num(config, 'limit', ctx.cities.length));
  return (
    <section className="container py-16">
      <SectionHeading
        eyebrow={str(config, 'eyebrow', 'Service Areas')}
        title={str(config, 'title', 'Areas We Serve')}
      />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ state, city }) => (
          <LocationCard
            key={city.slug}
            name={`${city.name}, ${state.abbr}`}
            href={paths.city(state.slug, city.slug)}
            meta={city.county}
          />
        ))}
      </div>
    </section>
  );
}

function LinkList({ title, links }: { title: string; links: LinkAnchor[] }) {
  if (links.length === 0) return null;
  return (
    <section className="container py-16">
      <SectionHeading align="left" title={title} />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((l) => (
          <Link
            key={l.href + l.label}
            href={l.href}
            className="group flex items-center justify-between rounded-lg border border-border p-4 hover:shadow-md"
          >
            <span className="font-medium">{l.label}</span>
            <ArrowRight className="size-4 text-muted-fg transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>
    </section>
  );
}

export function RelatedServicesBlock({ ctx, config }: BlockProps) {
  return (
    <LinkList
      title={str(config, 'title', 'Related Services')}
      links={ctx.content.relatedServices}
    />
  );
}

export function RelatedLocationsBlock({ ctx, config }: BlockProps) {
  return (
    <LinkList
      title={str(config, 'title', 'Nearby Areas')}
      links={ctx.content.relatedLocations}
    />
  );
}

export function FaqBlock({ ctx, config }: BlockProps) {
  if (ctx.content.faqs.length === 0) return null;
  return (
    <section className="container py-16">
      <SectionHeading
        eyebrow={str(config, 'eyebrow', 'FAQ')}
        title={str(config, 'title', 'Frequently Asked Questions')}
      />
      <div className="mt-10">
        <FAQ items={ctx.content.faqs} />
      </div>
    </section>
  );
}

export function LeadFormBlock({ ctx, config }: BlockProps) {
  return (
    <section className="container py-16">
      <div className="mx-auto max-w-2xl">
        <SectionHeading
          eyebrow={str(config, 'eyebrow', 'Get Started')}
          title={str(config, 'title', 'Request Your Free Quote')}
        />
        <div className="mt-8">
          <LeadForm services={ctx.services.map((s) => s.name)} />
        </div>
      </div>
    </section>
  );
}

export function MapBlock({ ctx, config }: BlockProps) {
  const place = ctx.city
    ? `${ctx.city.name}, ${ctx.state?.abbr ?? ''}`
    : `${ctx.business.address.city}, ${ctx.business.address.stateAbbr}`;
  return (
    <section className="container py-12">
      {config.title ? (
        <SectionHeading align="left" title={str(config, 'title')} className="mb-6" />
      ) : null}
      <MapEmbed query={place} title={`Map of ${place}`} />
    </section>
  );
}

export function CtaBlock({ ctx }: BlockProps) {
  return (
    <CTASection
      config={ctx.business}
      title={ctx.content.cta.title}
      description={ctx.content.cta.description}
    />
  );
}

export function EmergencyBannerBlock({ ctx }: BlockProps) {
  const e = ctx.content.emergency;
  const title = e?.title ?? `${ctx.business.category} Emergency?`;
  const description =
    e?.description ??
    `${ctx.business.name} offers 24/7 emergency response with fast arrival and upfront pricing.`;
  return (
    <EmergencyCTA title={title} description={description} phone={ctx.business.phone} />
  );
}
