import { Star, Quote, User } from 'lucide-react';
import { Reviews } from '@/components/site/Reviews';
import { SectionHeading } from '@/components/site/SectionHeading';
import { Card, CardContent } from '@/components/ui/card';
import type { BlockProps } from '@/lib/builder/types';

function str(config: Record<string, unknown>, key: string, fallback = ''): string {
  const v = config[key];
  return typeof v === 'string' ? v : fallback;
}

export function ReviewsBlock({ ctx, config }: BlockProps) {
  if (ctx.content.reviews.length === 0) return null;
  return (
    <section className="bg-muted/40 py-16">
      <div className="container">
        <SectionHeading
          eyebrow={str(config, 'eyebrow', 'Reviews')}
          title={str(config, 'title', 'What Our Customers Say')}
        />
        <div className="mt-10">
          <Reviews reviews={ctx.content.reviews} />
        </div>
      </div>
    </section>
  );
}

export function TestimonialsBlock({ ctx, config }: BlockProps) {
  const featured = ctx.content.reviews.slice(0, 2);
  if (featured.length === 0) return null;
  return (
    <section className="py-16">
      <div className="container">
        <SectionHeading
          eyebrow={str(config, 'eyebrow', 'Testimonials')}
          title={str(config, 'title', 'Trusted by Homeowners')}
        />
        <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-2">
          {featured.map((r) => (
            <div
              key={r.author + r.body.slice(0, 10)}
              className="rounded-xl border border-border bg-brand/5 p-8"
            >
              <Quote className="size-8 text-brand/40" />
              <p className="mt-4 text-lg font-medium">&ldquo;{r.body}&rdquo;</p>
              <div className="mt-4 flex items-center gap-1">
                {Array.from({ length: r.rating }).map((_, i) => (
                  <Star key={i} className="size-4 fill-accent text-accent" />
                ))}
              </div>
              <p className="mt-2 text-sm font-semibold">
                {r.author}
                {r.location ? (
                  <span className="text-muted-fg"> · {r.location}</span>
                ) : null}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TimelineBlock({ ctx, config }: BlockProps) {
  const steps = ctx.content.process;
  if (steps.length === 0) return null;
  return (
    <section className="py-16">
      <div className="container">
        <SectionHeading
          eyebrow={str(config, 'eyebrow', 'Our Process')}
          title={str(config, 'title', 'How It Works')}
        />
        <ol className="mx-auto mt-10 max-w-2xl space-y-6">
          {steps.map((s, i) => (
            <li key={s.title} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand font-bold text-brand-fg">
                  {i + 1}
                </span>
                {i < steps.length - 1 && (
                  <span className="mt-1 h-full w-px flex-1 bg-border" />
                )}
              </div>
              <div className="pb-4">
                <h3 className="font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-fg">{s.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function TeamBlock({ ctx, config }: BlockProps) {
  // Generic, clearly-illustrative team roles (no fabricated names).
  const roles = ['Owner & Lead Technician', 'Senior Technician', 'Dispatch & Support'];
  return (
    <section className="bg-muted/40 py-16">
      <div className="container">
        <SectionHeading
          eyebrow={str(config, 'eyebrow', 'Our Team')}
          title={str(config, 'title', `Meet the ${ctx.business.name} Team`)}
        />
        <div className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-3">
          {roles.map((role) => (
            <Card key={role} className="text-center">
              <CardContent className="flex flex-col items-center p-6">
                <span className="flex size-16 items-center justify-center rounded-full bg-brand/10 text-brand">
                  <User className="size-7" />
                </span>
                <p className="mt-4 font-semibold">{role}</p>
                <p className="mt-1 text-sm text-muted-fg">
                  Licensed &amp; background-checked
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
