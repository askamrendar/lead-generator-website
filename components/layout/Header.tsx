'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, Phone, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, formatPhone, telHref } from '@/lib/utils';
import { paths } from '@/lib/generator/config';
import type { BusinessConfig } from '@/lib/generator/schema';
import type { ResolvedService } from '@/lib/generator/config';

interface HeaderProps {
  config: BusinessConfig;
  services: ResolvedService[];
  cities: { name: string; href: string }[];
}

export function Header({ config, services, cities }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href={paths.home()} className="flex items-center gap-2 font-bold">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand text-brand-fg">
            {config.logoText?.[0] ?? config.name[0]}
          </span>
          <span className="text-lg">{config.logoText ?? config.name}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <NavDropdown label="Services" items={services.map((s) => ({ name: s.name, href: paths.service(s.slug) }))} />
          <NavDropdown label="Service Areas" items={cities} />
          <NavLink href={paths.about()}>About</NavLink>
          <NavLink href={paths.contact()}>Contact</NavLink>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <a
            href={telHref(config.phone)}
            className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-brand"
          >
            <Phone className="size-4" />
            {formatPhone(config.phone)}
          </a>
          <Button asChild variant="accent" size="sm">
            <Link href={paths.contact()}>Get a Free Quote</Link>
          </Button>
        </div>

        <button
          type="button"
          className="inline-flex size-10 items-center justify-center rounded-md md:hidden"
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="container flex flex-col gap-1 py-4">
            <MobileGroup label="Services" items={services.map((s) => ({ name: s.name, href: paths.service(s.slug) }))} onNavigate={() => setMobileOpen(false)} />
            <MobileGroup label="Service Areas" items={cities} onNavigate={() => setMobileOpen(false)} />
            <Link className="py-2 font-medium" href={paths.about()} onClick={() => setMobileOpen(false)}>
              About
            </Link>
            <Link className="py-2 font-medium" href={paths.contact()} onClick={() => setMobileOpen(false)}>
              Contact
            </Link>
            <Button asChild variant="accent" className="mt-2">
              <a href={telHref(config.phone)}>
                <Phone className="size-4" /> Call {formatPhone(config.phone)}
              </a>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
    >
      {children}
    </Link>
  );
}

function NavDropdown({
  label,
  items,
}: {
  label: string;
  items: { name: string; href: string }[];
}) {
  return (
    <div className="group relative">
      <button className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">
        {label}
        <ChevronDown className="size-4 transition-transform group-hover:rotate-180" />
      </button>
      <div className="invisible absolute left-0 top-full z-50 min-w-56 rounded-lg border border-border bg-background p-2 opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted"
          >
            {item.name}
          </Link>
        ))}
      </div>
    </div>
  );
}

function MobileGroup({
  label,
  items,
  onNavigate,
}: {
  label: string;
  items: { name: string; href: string }[];
  onNavigate: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        className={cn('flex w-full items-center justify-between py-2 font-medium')}
        onClick={() => setOpen((v) => !v)}
      >
        {label}
        <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="ml-3 flex flex-col border-l border-border pl-3">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="py-1.5 text-sm text-muted-fg hover:text-brand"
              onClick={onNavigate}
            >
              {item.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
