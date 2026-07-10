'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WEBSITE_NAV, websiteHref } from '@/lib/websites/nav';
import { cn } from '@/lib/utils';

/**
 * Horizontal, scrollable tab nav for a single website — config-driven from
 * `WEBSITE_NAV`. Each future module (Builder, AI, Pages, SEO, …) already has a tab;
 * "Soon" tabs point at placeholder pages.
 */
export function WebsiteDetailNav({ websiteId }: { websiteId: string }) {
  const pathname = usePathname() ?? '';

  return (
    <nav aria-label="Website" className="border-b border-border">
      <ul className="-mb-px flex gap-1 overflow-x-auto">
        {WEBSITE_NAV.map((item) => {
          const href = websiteHref(websiteId, item.segment);
          const active =
            item.segment === ''
              ? pathname === href
              : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={item.key}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'border-brand text-foreground'
                    : 'border-transparent text-muted-fg hover:border-border hover:text-foreground',
                )}
              >
                <item.icon className="size-4" aria-hidden />
                {item.label}
                {item.status === 'soon' ? (
                  <span className="rounded bg-muted px-1 py-0.5 text-[10px] font-semibold uppercase text-muted-fg">
                    Soon
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
