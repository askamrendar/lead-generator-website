import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { StatusBadge } from '@/components/websites/StatusBadge';
import { lifecycleBadge, generationBadge } from '@/lib/websites/status';
import type { WebsiteSummary } from '@/lib/websites/types';

/** Detail header: back link, website name/slug, and lifecycle badges. Presentational. */
export function WebsiteDetailHeader({ website }: { website: WebsiteSummary }) {
  return (
    <div className="space-y-3">
      <Link
        href="/dashboard/websites"
        className="inline-flex items-center gap-1 text-sm text-muted-fg transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Websites
      </Link>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold text-foreground sm:text-2xl">
            {website.name}
          </h1>
          <p className="truncate text-sm text-muted-fg">/{website.slug}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatusBadge badge={lifecycleBadge(website)} />
          <StatusBadge badge={generationBadge(website)} />
        </div>
      </div>
    </div>
  );
}
