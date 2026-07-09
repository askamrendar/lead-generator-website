import Link from 'next/link';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { formatPhone, telHref } from '@/lib/utils';
import {
  formatAddress,
  paths,
  type ResolvedService,
} from '@/lib/generator/config';
import type { BusinessConfig } from '@/lib/generator/schema';

interface FooterProps {
  config: BusinessConfig;
  services: ResolvedService[];
  cities: { name: string; href: string }[];
}

export function Footer({ config, services, cities }: FooterProps) {
  const year = 2026; // static build year; Date.now() avoided for reproducibility
  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="container grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="mb-3 text-lg font-bold">{config.logoText ?? config.name}</div>
          <p className="text-sm text-muted-fg">{config.tagline}</p>
          {config.licenseNumber && (
            <p className="mt-3 text-xs text-muted-fg">
              Licensed &amp; Insured · {config.licenseNumber}
            </p>
          )}
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide">
            Services
          </h3>
          <ul className="space-y-2 text-sm text-muted-fg">
            {services.slice(0, 6).map((s) => (
              <li key={s.slug}>
                <Link href={paths.service(s.slug)} className="hover:text-brand">
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide">
            Service Areas
          </h3>
          <ul className="space-y-2 text-sm text-muted-fg">
            {cities.map((c) => (
              <li key={c.href}>
                <Link href={c.href} className="hover:text-brand">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide">
            Contact
          </h3>
          <ul className="space-y-3 text-sm text-muted-fg">
            <li className="flex items-start gap-2">
              <Phone className="mt-0.5 size-4 shrink-0 text-brand" />
              <a href={telHref(config.phone)} className="hover:text-brand">
                {formatPhone(config.phone)}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <Mail className="mt-0.5 size-4 shrink-0 text-brand" />
              <a href={`mailto:${config.email}`} className="hover:text-brand">
                {config.email}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-brand" />
              <span>{formatAddress(config)}</span>
            </li>
            {config.hours.length > 0 && (
              <li className="flex items-start gap-2">
                <Clock className="mt-0.5 size-4 shrink-0 text-brand" />
                <span>
                  Mon–Fri {config.hours[0]?.open}–{config.hours[0]?.close}
                </span>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container flex flex-col items-center justify-between gap-2 py-6 text-xs text-muted-fg sm:flex-row">
          <p>
            © {year} {config.name}. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="/about" className="hover:text-brand">
              About
            </Link>
            <Link href="/contact" className="hover:text-brand">
              Contact
            </Link>
            <Link href="/sitemap.xml" className="hover:text-brand">
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
