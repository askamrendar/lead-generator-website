import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SectionHeading } from '@/components/site/SectionHeading';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { paths } from '@/lib/generator/config';
import type { BlockProps } from '@/lib/builder/types';

function str(config: Record<string, unknown>, key: string, fallback = ''): string {
  const v = config[key];
  return typeof v === 'string' ? v : fallback;
}

export function PricingBlock({ ctx, config }: BlockProps) {
  const priced = ctx.services.filter((s) => s.startingPrice).slice(0, 3);
  const tiers = priced.length > 0 ? priced : ctx.services.slice(0, 3);
  return (
    <section className="py-16">
      <div className="container">
        <SectionHeading
          eyebrow={str(config, 'eyebrow', 'Pricing')}
          title={str(config, 'title', 'Straightforward, Upfront Pricing')}
          description="Every job is quoted up front and approved before we start. No surprises."
        />
        <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-3">
          {tiers.map((s, i) => (
            <Card key={s.slug} className={i === 1 ? 'border-brand shadow-md' : ''}>
              <CardContent className="flex h-full flex-col p-6">
                {i === 1 && (
                  <span className="mb-2 w-fit rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
                    Most Popular
                  </span>
                )}
                <h3 className="font-semibold">{s.name}</h3>
                <p className="mt-2 text-3xl font-extrabold">
                  {s.startingPrice ?? 'Custom'}
                  {s.startingPrice && (
                    <span className="text-sm font-normal text-muted-fg"> starting</span>
                  )}
                </p>
                <p className="mt-2 flex-1 text-sm text-muted-fg">
                  {s.shortDescription}
                </p>
                <Button asChild variant={i === 1 ? 'primary' : 'outline'} className="mt-4">
                  <Link href={paths.service(s.slug)}>
                    Learn more <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export function BeforeAfterBlock({ ctx, config }: BlockProps) {
  return (
    <section className="bg-muted/40 py-16">
      <div className="container">
        <SectionHeading
          eyebrow={str(config, 'eyebrow', 'Before & After')}
          title={str(config, 'title', 'Real Results')}
        />
        <div className="mx-auto mt-10 grid max-w-4xl gap-6 sm:grid-cols-2">
          {(['Before', 'After'] as const).map((label) => (
            <div key={label} className="overflow-hidden rounded-xl border border-border">
              <div
                className={
                  label === 'After'
                    ? 'flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-brand/20 to-accent/20'
                    : 'flex aspect-[4/3] items-center justify-center bg-muted'
                }
              >
                <span className="rounded-full bg-background/80 px-4 py-1 text-sm font-semibold">
                  {label}
                </span>
              </div>
              <div className="p-4 text-sm text-muted-fg">
                {label === 'Before'
                  ? `A typical ${ctx.business.category.toLowerCase()} issue before our team arrives.`
                  : `The same job after ${ctx.business.name} — done right and guaranteed.`}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function GalleryBlock({ ctx, config }: BlockProps) {
  const images = [
    ctx.business.heroImage,
    ...ctx.services.map((s) => s.image),
  ].filter((x): x is string => Boolean(x));
  const prompts = ctx.content.imagePrompts;
  // Build up to 6 tiles: real images first, then captioned placeholders.
  const tiles = Array.from({ length: 6 }, (_, i) => ({
    image: images[i],
    caption: prompts[i]?.alt ?? `${ctx.business.category} work`,
  }));

  return (
    <section className="py-16">
      <div className="container">
        <SectionHeading
          eyebrow={str(config, 'eyebrow', 'Gallery')}
          title={str(config, 'title', 'Our Work')}
        />
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3">
          {tiles.map((t, i) => (
            <div
              key={i}
              className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border"
            >
              {t.image ? (
                <Image
                  src={t.image}
                  alt={t.caption}
                  fill
                  sizes="(min-width: 768px) 33vw, 50vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-brand/10 p-3 text-center text-xs text-muted-fg">
                  {t.caption}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
