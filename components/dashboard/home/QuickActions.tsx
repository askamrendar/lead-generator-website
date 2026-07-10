import * as React from 'react';
import Link from 'next/link';
import { Globe, Plus, Settings, Sparkles, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Action-first entry points for the home screen — "what should I do next?". Links to
 * real destinations; the AI Generator points at its (soon) surface. Config-driven so
 * new actions slot in without layout changes.
 */
interface QuickAction {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  accent?: boolean;
}

const ACTIONS: QuickAction[] = [
  { label: 'New website', description: 'Start from the guided wizard', href: '/dashboard/websites/new', icon: Plus, accent: true },
  { label: 'Generate with AI', description: 'Turn a business into a site', href: '/dashboard/ai-generator', icon: Sparkles },
  { label: 'Manage websites', description: 'Open the Website Manager', href: '/dashboard/websites', icon: Globe },
  { label: 'Workspace settings', description: 'Profile, team, providers', href: '/dashboard/settings', icon: Settings },
];

export function QuickActions() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {ACTIONS.map((a) => (
        <Link
          key={a.label}
          href={a.href}
          className={cn(
            'group flex flex-col gap-2 rounded-lg border p-4 transition-colors',
            a.accent
              ? 'border-brand/30 bg-brand/5 hover:bg-brand/10'
              : 'border-border bg-background hover:bg-muted',
          )}
        >
          <span
            className={cn(
              'flex size-9 items-center justify-center rounded-md',
              a.accent ? 'bg-brand text-brand-fg' : 'bg-muted text-muted-fg',
            )}
          >
            <a.icon className="size-5" aria-hidden />
          </span>
          <span className="text-sm font-semibold text-foreground">{a.label}</span>
          <span className="text-xs text-muted-fg">{a.description}</span>
        </Link>
      ))}
    </div>
  );
}
