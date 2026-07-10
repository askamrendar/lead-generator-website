'use client';

import * as React from 'react';
import { Drawer } from '@/components/ui/modal';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { CommandPalette } from '@/components/dashboard/CommandPalette';
import type {
  OrgSummary,
  WorkspaceSummary,
} from '@/lib/dashboard/context';

/**
 * Responsive dashboard shell: a fixed desktop sidebar (≥ md) and a slide-in mobile
 * drawer sharing one `SidebarNav`, plus the sticky header and the main content area.
 * The mobile-open state is owned here so the header's menu button and the drawer stay
 * in sync. Content is wrapped in an ErrorBoundary so a module failure degrades locally.
 */
export function DashboardShell({
  user,
  organizations,
  currentOrg,
  workspaces,
  currentWorkspace,
  children,
}: {
  user: { name: string | null; email: string | null };
  organizations: OrgSummary[];
  currentOrg: OrgSummary | null;
  workspaces: WorkspaceSummary[];
  currentWorkspace: WorkspaceSummary | null;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [paletteOpen, setPaletteOpen] = React.useState(false);

  // Global ⌘K / Ctrl+K opens the command palette.
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="flex min-h-dvh bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-background md:flex md:flex-col">
        <SidebarNav />
      </aside>

      {/* Mobile drawer */}
      <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)} side="left" title="Menu">
        <div className="-mx-6 -my-4">
          <SidebarNav onNavigate={() => setMobileOpen(false)} />
        </div>
      </Drawer>

      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader
          user={user}
          organizations={organizations}
          currentOrg={currentOrg}
          workspaces={workspaces}
          currentWorkspace={currentWorkspace}
          onMenu={() => setMobileOpen(true)}
          onOpenSearch={() => setPaletteOpen(true)}
        />
        <main className="flex-1">
          <ErrorBoundary>
            <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
              {children}
            </div>
          </ErrorBoundary>
        </main>
      </div>

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        workspaceId={currentWorkspace?.id}
      />
    </div>
  );
}
