'use client';

import * as React from 'react';
import Link from 'next/link';
import { Globe, Plus } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { FilterBar } from '@/components/ui/filter-bar';
import { SearchInput } from '@/components/ui/search-input';
import { DataTable, type Column } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/websites/StatusBadge';
import { WebsiteActions } from '@/components/websites/WebsiteActions';
import { lifecycleBadge, deploymentBadge, domainBadge } from '@/lib/websites/status';
import { websiteHref } from '@/lib/websites/nav';
import type { WebsiteSummary } from '@/lib/websites/types';

const STATUSES = ['ALL', 'DRAFT', 'GENERATED', 'PUBLISHED', 'ARCHIVED'] as const;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function WebsiteList({ websites }: { workspaceId: string; websites: WebsiteSummary[] }) {
  const [query, setQuery] = React.useState('');
  const [status, setStatus] = React.useState<(typeof STATUSES)[number]>('ALL');

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return websites.filter((w) => {
      const matchesQuery = !q || w.name.toLowerCase().includes(q) || w.slug.toLowerCase().includes(q);
      const matchesStatus = status === 'ALL' || w.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [websites, query, status]);

  const newButton = (
    <Button asChild>
      <Link href="/dashboard/websites/new">
        <Plus aria-hidden />
        New website
      </Link>
    </Button>
  );

  const columns: Column<WebsiteSummary>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (w) => (
        <div className="min-w-0">
          <Link href={websiteHref(w.id, '')} className="font-medium text-foreground hover:underline">
            {w.name}
          </Link>
          <p className="truncate text-xs text-muted-fg">/{w.slug}</p>
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: (w) => <StatusBadge badge={lifecycleBadge(w)} /> },
    { key: 'deployment', header: 'Deployment', render: () => <StatusBadge badge={deploymentBadge()} /> },
    { key: 'domain', header: 'Domain', render: () => <StatusBadge badge={domainBadge()} /> },
    { key: 'updated', header: 'Updated', render: (w) => <span className="text-muted-fg">{formatDate(w.updatedAt)}</span> },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      align: 'right',
      render: (w) => (
        <div className="flex justify-end">
          <WebsiteActions website={w} />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Websites"
        description="Create, manage, and open your websites."
        actions={newButton}
      />

      {websites.length === 0 ? (
        <EmptyState
          icon={Globe}
          title="No websites yet"
          description="Create your first website with the guided wizard. You can generate and edit it in the next steps."
          action={newButton}
        />
      ) : (
        <>
          <FilterBar>
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search websites…"
              className="w-full sm:w-64"
            />
            <label className="sr-only" htmlFor="status-filter">
              Filter by status
            </label>
            <select
              id="status-filter"
              value={status}
              onChange={(e) => setStatus(e.target.value as (typeof STATUSES)[number])}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s === 'ALL' ? 'All statuses' : s.charAt(0) + s.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </FilterBar>

          <DataTable
            columns={columns}
            rows={filtered}
            getRowKey={(w) => w.id}
            empty="No websites match your filters."
          />
        </>
      )}
    </div>
  );
}
