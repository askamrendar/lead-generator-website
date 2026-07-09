import type { Metadata } from 'next';
import { Check, ShieldCheck, Award, Users } from 'lucide-react';
import { business } from '@/data/business';
import { buildMetadata } from '@/lib/seo/metadata';
import { paths, serviceAreaSummary } from '@/lib/generator/config';
import { buildAboutContext } from '@/lib/ai/context';
import { resolvePageContent } from '@/lib/ai/render';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SectionHeading } from '@/components/site/SectionHeading';
import { Stats } from '@/components/site/Stats';
import { CTASection } from '@/components/site/CTASection';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbSchema } from '@/lib/seo/schema';

export async function generateMetadata(): Promise<Metadata> {
  const { content } = await resolvePageContent(buildAboutContext(business));
  return buildMetadata({
    config: business,
    title: `About ${business.name}`,
    description: content.metaDescription,
    path: paths.about(),
  });
}

const values = [
  { icon: ShieldCheck, title: 'Integrity First', text: 'Honest recommendations and upfront pricing — always.' },
  { icon: Award, title: 'Quality Workmanship', text: 'Code-compliant work backed by our satisfaction guarantee.' },
  { icon: Users, title: 'Local & Family-Owned', text: 'We live and work in the communities we serve.' },
];

export default async function AboutPage() {
  const { content } = await resolvePageContent(buildAboutContext(business));
  const crumbs = [
    { name: 'Home', path: paths.home() },
    { name: 'About', path: paths.about() },
  ];

  return (
    <>
      <div className="border-b border-border bg-muted/40">
        <div className="container py-10">
          <Breadcrumbs crumbs={crumbs} />
          <div className="mt-6">
            <SectionHeading
              align="left"
              eyebrow="About Us"
              title={`Your Trusted ${business.category} Partner`}
              description={content.intro}
            />
          </div>
        </div>
      </div>

      <Stats config={business} />

      <section className="container py-16">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <div className="space-y-4 text-muted-fg">
            <h2 className="text-2xl font-bold text-foreground">Our Story</h2>
            <p>
              {business.name} was built on a simple idea: treat every customer
              the way we&rsquo;d want our own family treated.{' '}
              {business.yearsInBusiness
                ? `For over ${business.yearsInBusiness} years, `
                : 'Since day one, '}
              we&rsquo;ve delivered dependable {business.category.toLowerCase()}{' '}
              service to homeowners and businesses across{' '}
              {serviceAreaSummary(business)}.
            </p>
            <p>
              Our licensed technicians show up on time, explain your options in
              plain language, and quote a fair, flat-rate price before any work
              begins. No pressure, no surprises — just quality work that lasts.
            </p>
            {business.guarantees.length > 0 && (
              <ul className="space-y-2 pt-2">
                {business.guarantees.map((g) => (
                  <li key={g} className="flex items-start gap-2 text-foreground">
                    <Check className="mt-0.5 size-4 shrink-0 text-brand" />
                    {g}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid gap-6">
            {values.map((v) => (
              <div key={v.title} className="rounded-lg border border-border p-6">
                <span className="flex size-11 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  <v.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-semibold">{v.title}</h3>
                <p className="mt-1 text-sm text-muted-fg">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTASection config={business} />
      <JsonLd data={breadcrumbSchema(business, crumbs)} />
    </>
  );
}
