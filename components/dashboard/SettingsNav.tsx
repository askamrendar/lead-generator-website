'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SETTINGS_NAV } from '@/lib/dashboard/settings-nav';
import { cn } from '@/lib/utils';

/** Settings section sub-nav (vertical on desktop, horizontal-scroll on mobile). */
export function SettingsNav() {
  const pathname = usePathname() ?? '';

  return (
    <nav aria-label="Settings" className="lg:w-56 lg:shrink-0">
      <ul className="flex gap-1 overflow-x-auto lg:flex-col">
        {SETTINGS_NAV.map((item) => {
          const active =
            item.href === '/dashboard/settings'
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  active ? 'bg-muted text-foreground' : 'text-muted-fg hover:bg-muted hover:text-foreground',
                )}
              >
                <item.icon className="size-4 shrink-0" aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
