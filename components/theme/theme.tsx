'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';

/**
 * Minimal, dependency-free dark-mode support. The design tokens already define a
 * `.dark` variant in globals.css, so toggling the `dark` class on <html> re-themes
 * every token-based component (auth, dashboard, …). Marketing SSR output is
 * unchanged — the class is applied client-side only, so SEO/HTML stays identical.
 *
 * No-FOUC: {@link THEME_INIT_SCRIPT} runs in <head> before paint to apply a stored
 * preference. Default is light unless the user explicitly chose dark.
 */

export const THEME_STORAGE_KEY = 'theme';

/** Inline script for the document <head> — applies the saved theme pre-paint. */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();`;

function getIsDark(): boolean {
  if (typeof document === 'undefined') return false;
  return document.documentElement.classList.contains('dark');
}

function applyTheme(dark: boolean): void {
  const root = document.documentElement;
  root.classList.toggle('dark', dark);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, dark ? 'dark' : 'light');
  } catch {
    /* storage unavailable — ignore */
  }
}

/** Accessible light/dark toggle button. */
export function ThemeToggle({ className }: { className?: string }) {
  const [dark, setDark] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    setDark(getIsDark());
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    applyTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={mounted ? dark : undefined}
      className={
        'inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ' +
        (className ?? '')
      }
    >
      {/* Render both; CSS-independent, avoids hydration mismatch flashes. */}
      {mounted && dark ? (
        <Sun className="size-4" aria-hidden />
      ) : (
        <Moon className="size-4" aria-hidden />
      )}
    </button>
  );
}
