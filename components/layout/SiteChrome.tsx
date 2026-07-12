'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';

/**
 * Renders the marketing chrome (Header / Footer / sticky call bar) around page
 * content — EXCEPT on authenticated-app routes (auth, dashboard, app), which supply
 * their own shell. This keeps the public marketing site's rendered output identical
 * (chrome nodes are passed through unchanged) while giving `/login` et al. a clean,
 * chrome-free canvas — without moving any marketing route files.
 */

const BARE_PREFIXES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/invitations',
  '/logout',
  '/dashboard',
  '/app',
];

function isBareRoute(pathname: string): boolean {
  return BARE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function SiteChrome({
  header,
  footer,
  sticky,
  children,
}: {
  header: React.ReactNode;
  footer: React.ReactNode;
  sticky: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? '/';

  if (isBareRoute(pathname)) {
    return (
      <main id="main" className="flex-1">
        {children}
      </main>
    );
  }

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-brand focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>
      {header}
      {/* pb-16 clears the mobile sticky call bar so it doesn't overlay footer content. */}
      <main id="main" className="flex-1 pb-16 md:pb-0">
        {children}
      </main>
      {footer}
      {sticky}
    </>
  );
}
