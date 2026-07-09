import Link from 'next/link';
import { Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPhone, telHref } from '@/lib/utils';
import { paths } from '@/lib/generator/config';
import type { BusinessConfig } from '@/lib/generator/schema';

interface CTASectionProps {
  config: BusinessConfig;
  title?: string;
  description?: string;
}

export function CTASection({ config, title, description }: CTASectionProps) {
  return (
    <section className="bg-brand text-brand-fg">
      <div className="container flex flex-col items-center gap-6 py-14 text-center">
        <h2 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
          {title ?? `Ready to Get Started with ${config.name}?`}
        </h2>
        <p className="max-w-xl text-lg text-brand-fg/90">
          {description ??
            `Talk to a real person now for fast scheduling and an upfront quote — no obligation.`}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" variant="accent">
            <a href={telHref(config.phone)}>
              <Phone className="size-5" /> Call {formatPhone(config.phone)}
            </a>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-brand-fg/30 bg-transparent text-brand-fg hover:bg-brand-fg/10"
          >
            <Link href={paths.contact()}>Request a Free Quote</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
