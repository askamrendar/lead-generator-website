'use client';

import * as React from 'react';
import { Monitor, Sun, Moon, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { THEME_STORAGE_KEY } from '@/components/theme/theme';
import { setThemeAction } from '@/app/dashboard/preferences/actions';
import type { Preferences, ThemePreference } from '@/lib/preferences/service';

const OPTIONS: { value: ThemePreference; label: string; icon: typeof Monitor }[] = [
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
];

const SHORTCUTS: [string, string][] = [
  ['⌘K / Ctrl+K', 'Open command palette'],
  ['G then D', 'Go to Dashboard'],
  ['G then W', 'Go to Websites'],
  ['G then J', 'Go to Background Jobs'],
  ['?', 'Show keyboard shortcuts'],
];

/**
 * Workspace / theme preferences. Theme is persisted server-side (durable across
 * devices) AND mirrored to localStorage so the existing no-FOUC init script + header
 * toggle stay in sync — no duplicate theme system.
 */
export function PreferencesPanel({ preferences }: { preferences: Preferences }) {
  const [theme, setTheme] = React.useState<ThemePreference>(preferences.theme);
  const [pending, startTransition] = React.useTransition();

  function applyLocal(next: ThemePreference) {
    const root = document.documentElement;
    if (next === 'dark') root.classList.add('dark');
    else if (next === 'light') root.classList.remove('dark');
    else {
      const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', Boolean(prefersDark));
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next === 'dark' ? 'dark' : 'light');
    } catch {
      /* storage unavailable */
    }
  }

  function choose(next: ThemePreference) {
    setTheme(next);
    applyLocal(next);
    startTransition(() => setThemeAction(next).then(() => undefined));
  }

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-foreground">Theme</h2>
        <p className="mt-1 text-sm text-muted-fg">Choose how the dashboard looks. Saved to your account.</p>
        <div className="mt-4 grid grid-cols-3 gap-3 sm:max-w-md">
          {OPTIONS.map((o) => {
            const Icon = o.icon;
            const active = theme === o.value;
            return (
              <button
                key={o.value}
                type="button"
                disabled={pending}
                onClick={() => choose(o.value)}
                aria-pressed={active}
                className={`flex flex-col items-center gap-2 rounded-lg border p-4 text-sm transition-colors ${
                  active ? 'border-brand bg-brand/5 text-foreground' : 'border-border text-muted-fg hover:bg-muted'
                }`}
              >
                <Icon className="size-5" aria-hidden />
                <span className="flex items-center gap-1">
                  {o.label}
                  {active && <Check className="size-3.5 text-brand" aria-hidden />}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-foreground">Keyboard shortcuts</h2>
        <ul className="mt-3 divide-y divide-border">
          {SHORTCUTS.map(([keys, desc]) => (
            <li key={keys} className="flex items-center justify-between py-2 text-sm">
              <span className="text-muted-fg">{desc}</span>
              <kbd className="rounded border border-border bg-muted px-2 py-0.5 text-xs text-foreground">{keys}</kbd>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
