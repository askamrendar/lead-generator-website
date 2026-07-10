import * as React from 'react';
import type { StatusBadge as StatusBadgeData, Tone } from '@/lib/websites/status';
import { cn } from '@/lib/utils';

/** Colored pill for a derived website status. Tone → token-based classes (dark-safe). */
const TONE_CLASS: Record<Tone, string> = {
  neutral: 'bg-muted text-muted-fg',
  success: 'bg-green-500/15 text-green-700 dark:text-green-400',
  warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  info: 'bg-brand/15 text-brand',
};

export function StatusBadge({ badge, className }: { badge: StatusBadgeData; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        TONE_CLASS[badge.tone],
        className,
      )}
    >
      {badge.label}
    </span>
  );
}
