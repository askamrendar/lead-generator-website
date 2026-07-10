'use client';

import * as React from 'react';
import { Menu, Search } from 'lucide-react';
import { ThemeToggle } from '@/components/theme/theme';
import { Breadcrumbs } from '@/components/dashboard/Breadcrumbs';
import { OrganizationSwitcher } from '@/components/dashboard/OrganizationSwitcher';
import { WorkspaceSwitcher } from '@/components/dashboard/WorkspaceSwitcher';
import { UserMenu } from '@/components/dashboard/UserMenu';
import { NotificationsButton } from '@/components/dashboard/NotificationsButton';
import type {
  OrgSummary,
  WorkspaceSummary,
} from '@/lib/dashboard/context';

/**
 * Sticky app header: mobile menu trigger, org/workspace switchers, global search
 * (placeholder), notifications, theme toggle, and the account menu — with a
 * breadcrumb sub-row. Purely presentational; data comes from the server layout.
 */
export function DashboardHeader({
  user,
  organizations,
  currentOrg,
  workspaces,
  currentWorkspace,
  onMenu,
  onOpenSearch,
}: {
  user: { name: string | null; email: string | null };
  organizations: OrgSummary[];
  currentOrg: OrgSummary | null;
  workspaces: WorkspaceSummary[];
  currentWorkspace: WorkspaceSummary | null;
  onMenu: () => void;
  onOpenSearch: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
      <div className="flex h-16 items-center gap-2 px-4">
        <button
          type="button"
          onClick={onMenu}
          aria-label="Open navigation"
          className="inline-flex size-9 items-center justify-center rounded-md text-muted-fg transition-colors hover:bg-muted hover:text-foreground md:hidden"
        >
          <Menu className="size-5" aria-hidden />
        </button>

        <div className="flex items-center gap-2">
          <OrganizationSwitcher organizations={organizations} current={currentOrg} />
          <div className="hidden sm:block">
            <WorkspaceSwitcher workspaces={workspaces} current={currentWorkspace} />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenSearch}
            className="hidden h-9 w-56 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm text-muted-fg transition-colors hover:bg-muted lg:flex"
          >
            <Search className="size-4" aria-hidden />
            <span className="flex-1 text-left">Search…</span>
            <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px]">⌘K</kbd>
          </button>
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Search"
            className="inline-flex size-9 items-center justify-center rounded-md text-muted-fg transition-colors hover:bg-muted hover:text-foreground lg:hidden"
          >
            <Search className="size-4" aria-hidden />
          </button>
          <NotificationsButton />
          <ThemeToggle />
          <UserMenu name={user.name} email={user.email} />
        </div>
      </div>

      <div className="hidden border-t border-border px-4 py-2 sm:block">
        <Breadcrumbs />
      </div>
    </header>
  );
}
