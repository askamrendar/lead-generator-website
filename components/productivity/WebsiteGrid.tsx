'use client';

import * as React from 'react';
import Link from 'next/link';
import { Globe, Pin, PinOff, Star, Paintbrush, Copy } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { websiteHref } from '@/lib/websites/nav';
import { pinWebsiteAction, favoriteWebsiteAction } from '@/app/dashboard/productivity/actions';
import { duplicateWebsiteAction } from '@/app/dashboard/websites/actions';
import type { WebsiteSummary } from '@/lib/websites/types';

/**
 * Reusable website card grid with productivity quick-actions (pin, favorite,
 * duplicate). Used by Recent / Pinned / Favorites views. Reuses the website nav
 * helper + server actions — no duplicated CRUD.
 */
export function WebsiteGrid({
  websites,
  emptyTitle = 'Nothing here yet',
  emptyDescription = 'Websites will appear here.',
}: {
  websites: WebsiteSummary[];
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const [pending, startTransition] = React.useTransition();

  if (websites.length === 0) {
    return <EmptyState icon={Globe} title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {websites.map((w) => (
        <Card key={w.id} className="flex flex-col p-4">
          <div className="flex items-start justify-between gap-2">
            <Link href={websiteHref(w.id, '')} className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground hover:underline">{w.name}</p>
              <p className="truncate text-xs text-muted-fg">/{w.slug}</p>
            </Link>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                aria-label={w.favorite ? 'Unfavorite' : 'Favorite'}
                aria-pressed={w.favorite}
                disabled={pending}
                onClick={() => startTransition(() => favoriteWebsiteAction(w.id, !w.favorite).then(() => undefined))}
                className="rounded-md p-1.5 text-muted-fg hover:bg-muted hover:text-foreground"
              >
                <Star className={`size-4 ${w.favorite ? 'fill-amber-400 text-amber-500' : ''}`} aria-hidden />
              </button>
              <button
                type="button"
                aria-label={w.pinnedAt ? 'Unpin' : 'Pin'}
                aria-pressed={Boolean(w.pinnedAt)}
                disabled={pending}
                onClick={() => startTransition(() => pinWebsiteAction(w.id, !w.pinnedAt).then(() => undefined))}
                className="rounded-md p-1.5 text-muted-fg hover:bg-muted hover:text-foreground"
              >
                {w.pinnedAt ? <PinOff className="size-4" aria-hidden /> : <Pin className="size-4" aria-hidden />}
              </button>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <Button asChild size="sm" variant="outline" className="flex-1">
              <Link href={websiteHref(w.id, 'builder')}>
                <Paintbrush aria-hidden /> Open
              </Link>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() => startTransition(() => duplicateWebsiteAction(w.id).then(() => undefined))}
              aria-label="Duplicate"
            >
              <Copy aria-hidden />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
