import Link from 'next/link';
import Image from 'next/image';
import { Phone, Star, ShieldCheck, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPhone, telHref } from '@/lib/utils';
import { paths } from '@/lib/generator/config';
import type { BusinessConfig } from '@/lib/generator/schema';

interface HeroProps {
  config: BusinessConfig;
  headline: string;
  subhead: string;
  /** Optional badge above the headline, e.g. "Emergency Service". */
  eyebrow?: string;
}

export function Hero({ config, headline, subhead, eyebrow }: HeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-muted/60 to-background">
      <div className="container grid gap-10 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
        <div className="animate-fade-up">
          {eyebrow && (
            <Badge variant="accent" className="mb-4">
              {eyebrow}
            </Badge>
          )}
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            {headline}
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-fg">{subhead}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="accent">
              <a href={telHref(config.phone)}>
                <Phone className="size-5" /> Call {formatPhone(config.phone)}
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={paths.contact()}>Request a Free Quote</Link>
            </Button>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-muted-fg">
            {config.ratingValue && (
              <li className="flex items-center gap-2">
                <Star className="size-4 fill-accent text-accent" />
                {config.ratingValue}/5 from {config.ratingCount}+ reviews
              </li>
            )}
            <li className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-brand" />
              Licensed &amp; Insured
            </li>
            <li className="flex items-center gap-2">
              <Clock className="size-4 text-brand" />
              Fast Same-Day Service
            </li>
          </ul>
        </div>

        {config.heroImage && (
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border shadow-lg">
            <Image
              src={config.heroImage}
              alt={`${config.primaryService} by ${config.name}`}
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        )}
      </div>
    </section>
  );
}
