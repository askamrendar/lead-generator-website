import type { Metadata } from 'next';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { business } from '@/data/business';
import { buildMetadata } from '@/lib/seo/metadata';
import {
  formatAddress,
  getServices,
  paths,
} from '@/lib/generator/config';
import { formatPhone, telHref } from '@/lib/utils';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SectionHeading } from '@/components/site/SectionHeading';
import { LeadForm } from '@/components/forms/LeadForm';
import { MapEmbed } from '@/components/site/MapEmbed';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbSchema } from '@/lib/seo/schema';

export const metadata: Metadata = buildMetadata({
  config: business,
  title: `Contact ${business.name}`,
  description: `Get in touch with ${business.name}. Call ${business.phone} or request a free quote online. Fast scheduling and upfront pricing.`,
  path: paths.contact(),
});

export default function ContactPage() {
  const crumbs = [
    { name: 'Home', path: paths.home() },
    { name: 'Contact', path: paths.contact() },
  ];

  return (
    <>
      <div className="border-b border-border bg-muted/40">
        <div className="container py-10">
          <Breadcrumbs crumbs={crumbs} />
          <div className="mt-6">
            <SectionHeading
              align="left"
              eyebrow="Contact"
              title="Get in Touch"
              description={`Reach ${business.name} for fast scheduling, upfront quotes, and 24/7 emergency service.`}
            />
          </div>
        </div>
      </div>

      <section className="container py-16">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <div>
            <div className="grid gap-4 sm:grid-cols-2">
              <ContactCard icon={Phone} label="Call Us">
                <a href={telHref(business.phone)} className="text-brand hover:underline">
                  {formatPhone(business.phone)}
                </a>
              </ContactCard>
              <ContactCard icon={Mail} label="Email Us">
                <a href={`mailto:${business.email}`} className="text-brand hover:underline">
                  {business.email}
                </a>
              </ContactCard>
              <ContactCard icon={MapPin} label="Visit Us">
                <span className="text-muted-fg">{formatAddress(business)}</span>
              </ContactCard>
              <ContactCard icon={Clock} label="Hours">
                <ul className="space-y-0.5 text-muted-fg">
                  {business.hours.map((h) => (
                    <li key={h.day} className="flex justify-between gap-3">
                      <span>{h.day.slice(0, 3)}</span>
                      <span>
                        {h.open.toLowerCase() === 'closed'
                          ? 'Closed'
                          : `${h.open}–${h.close}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </ContactCard>
            </div>

            <div className="mt-6">
              <MapEmbed
                query={formatAddress(business)}
                title={`Map to ${business.name}`}
              />
            </div>
          </div>

          <div>
            <LeadForm
              title="Request a Free Quote"
              services={getServices(business).map((s) => s.name)}
            />
          </div>
        </div>
      </section>

      <JsonLd data={breadcrumbSchema(business, crumbs)} />
    </>
  );
}

function ContactCard({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border p-5">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Icon className="size-4 text-brand" />
        {label}
      </div>
      <div className="mt-2 text-sm">{children}</div>
    </div>
  );
}
