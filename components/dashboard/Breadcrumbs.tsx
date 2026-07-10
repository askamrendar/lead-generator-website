'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { labelForHref } from '@/lib/dashboard/nav';

/** Title-case a raw path segment as a fallback label. */
function humanize(segment: string): string {
  return segment
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Breadcrumb trail derived from the current path. Known routes use their nav label;
 * unknown/dynamic segments fall back to a humanized form. The last crumb is current.
 */
export function Breadcrumbs() {
  const pathname = usePathname() ?? '/dashboard';
  const segments = pathname.split('/').filter(Boolean); // e.g. ['dashboard','websites']

  const crumbs = segments.map((seg, i) => {
    const href = '/' + segments.slice(0, i + 1).join('/');
    return { href, label: labelForHref(href) ?? humanize(seg) };
  });

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex items-center gap-1 text-sm">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <li key={crumb.href} className="flex min-w-0 items-center gap-1">
              {i > 0 ? (
                <ChevronRight className="size-4 shrink-0 text-muted-fg" aria-hidden />
              ) : null}
              {isLast ? (
                <span className="truncate font-medium text-foreground" aria-current="page">
                  {crumb.label}
                </span>
              ) : (
                <Link href={crumb.href} className="truncate text-muted-fg hover:text-foreground">
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
