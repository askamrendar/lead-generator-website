import * as React from 'react';
import Link from 'next/link';
import { Globe, Paintbrush, Plus } from 'lucide-react';
import { Panel } from '@/components/ui/panel';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/websites/StatusBadge';
import { lifecycleBadge } from '@/lib/websites/status';
import { websiteHref } from '@/lib/websites/nav';
import type { WebsiteSummary } from '@/lib/websites/types';

function relativeTime(iso: string, now: number): string {
  const diff = now - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

/**
 * "Continue working" — the most recently updated websites with a quick jump into the
 * builder. Real, tenant-scoped data (passed from the server page). Honest empty state
 * when the workspace has no websites yet.
 */
export function RecentWebsites({
  websites,
  now,
}: {
  websites: WebsiteSummary[];
  now: number;
}) {
  return (
    <Panel
      title="Continue working"
      description="Your most recently updated websites"
      viewAllHref="/dashboard/websites"
      bodyClassName={websites.length === 0 ? undefined : 'p-0'}
    >
      {websites.length === 0 ? (
        <EmptyState
          icon={Globe}
          title="No websites yet"
          description="Create your first website to see it here."
          action={
            <Button asChild size="sm">
              <Link href="/dashboard/websites/new">
                <Plus aria-hidden />
                New website
              </Link>
            </Button>
          }
          className="border-0"
        />
      ) : (
        <ul className="divide-y divide-border">
          {websites.map((w) => (
            <li key={w.id} className="flex items-center gap-3 px-5 py-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-fg">
                <Globe className="size-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <Link
                  href={websiteHref(w.id, '')}
                  className="truncate text-sm font-medium text-foreground hover:underline"
                >
                  {w.name}
                </Link>
                <p className="truncate text-xs text-muted-fg">
                  /{w.slug} · updated {relativeTime(w.updatedAt, now)}
                </p>
              </div>
              <StatusBadge badge={lifecycleBadge(w)} />
              <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex">
                <Link href={websiteHref(w.id, 'builder')}>
                  <Paintbrush aria-hidden />
                  Open
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
