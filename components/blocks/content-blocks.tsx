import { Check, ShieldCheck, BadgeCheck, Clock, Award } from 'lucide-react';
import { Hero } from '@/components/site/Hero';
import { StatBar } from '@/components/site/StatBar';
import { CommonProblems } from '@/components/site/CommonProblems';
import { SectionHeading } from '@/components/site/SectionHeading';
import type { BlockProps } from '@/lib/builder/types';

/** Read a string config field with a fallback. */
function str(config: Record<string, unknown>, key: string, fallback = ''): string {
  const v = config[key];
  return typeof v === 'string' ? v : fallback;
}

export function HeroBlock({ ctx, config }: BlockProps) {
  return (
    <Hero
      config={ctx.business}
      headline={ctx.content.heroHeading}
      subhead={ctx.content.heroCopy}
      eyebrow={str(config, 'eyebrow') || undefined}
    />
  );
}

export function RichTextBlock({ ctx, config }: BlockProps) {
  const body = str(config, 'text') || ctx.content.intro;
  return (
    <section className="container py-12">
      <div className="mx-auto max-w-3xl">
        {config.title ? (
          <SectionHeading align="left" title={str(config, 'title')} />
        ) : null}
        <p className="mt-4 text-lg leading-relaxed text-muted-fg">{body}</p>
      </div>
    </section>
  );
}

export function BenefitsBlock({ ctx, config }: BlockProps) {
  return (
    <section className="container py-16">
      <SectionHeading
        eyebrow={str(config, 'eyebrow', 'Why Choose Us')}
        title={str(config, 'title', `Why ${ctx.business.name}`)}
      />
      <ul className="mx-auto mt-10 grid max-w-4xl gap-3 sm:grid-cols-2">
        {ctx.content.benefits.map((b) => (
          <li key={b} className="flex items-start gap-3 rounded-lg border border-border p-4">
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
              <Check className="size-4" />
            </span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ProblemsBlock({ ctx, config }: BlockProps) {
  if (ctx.content.problems.length === 0) return null;
  return (
    <section className="bg-muted/40 py-16">
      <div className="container">
        <SectionHeading
          eyebrow={str(config, 'eyebrow', 'Common Problems')}
          title={str(config, 'title', 'Problems We Solve')}
        />
        <div className="mt-10">
          <CommonProblems items={ctx.content.problems} />
        </div>
      </div>
    </section>
  );
}

export function StatsBlock({ ctx }: BlockProps) {
  return <StatBar stats={ctx.content.stats} />;
}

export function TrustBadgesBlock({ config }: BlockProps) {
  const badges = [
    { icon: BadgeCheck, label: 'Upfront Pricing' },
    { icon: ShieldCheck, label: 'Licensed & Insured' },
    { icon: Clock, label: '24/7 Emergency' },
    { icon: Award, label: 'Satisfaction Guaranteed' },
  ];
  return (
    <section className="border-y border-border py-10">
      <div className="container">
        {config.title ? (
          <p className="mb-6 text-center text-sm font-semibold uppercase tracking-wide text-muted-fg">
            {str(config, 'title')}
          </p>
        ) : null}
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {badges.map((b) => (
            <div key={b.label} className="flex flex-col items-center gap-2 text-center">
              <span className="flex size-11 items-center justify-center rounded-full bg-brand/10 text-brand">
                <b.icon className="size-5" />
              </span>
              <span className="text-sm font-medium">{b.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
