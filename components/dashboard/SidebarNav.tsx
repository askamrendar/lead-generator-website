'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DASHBOARD_NAV } from '@/lib/dashboard/nav';
import { business } from '@/data/business';
import { cn } from '@/lib/utils';

/**
 * Sidebar navigation, rendered from the `DASHBOARD_NAV` config (no hard-coded links).
 * Shared by the desktop sidebar and the mobile drawer. Highlights the active route
 * and marks not-yet-built modules with a "Soon" chip. `onNavigate` lets the mobile
 * drawer close on selection.
 */
function isActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname() ?? '';

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-5">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="truncate text-base font-bold text-foreground"
        >
          {business.name}
        </Link>
      </div>

      <nav aria-label="Dashboard" className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {DASHBOARD_NAV.map((section, si) => (
          <div key={section.title ?? si}>
            {section.title ? (
              <p className="px-3 pb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-fg">
                {section.title}
              </p>
            ) : null}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        active
                          ? 'bg-brand text-brand-fg'
                          : 'text-foreground hover:bg-muted',
                      )}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.status === 'soon' ? (
                        <span
                          className={cn(
                            'rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase',
                            active
                              ? 'bg-brand-fg/20 text-brand-fg'
                              : 'bg-muted text-muted-fg',
                          )}
                        >
                          Soon
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
}
