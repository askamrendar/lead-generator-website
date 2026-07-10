import * as React from 'react';
import { redirect } from 'next/navigation';
import { loadDashboardContext } from '@/lib/dashboard/context';
import { ToastProvider } from '@/components/ui/toast';
import { DashboardShell } from '@/components/dashboard/DashboardShell';

/**
 * The permanent authenticated application shell (server). Loads the tenant context
 * (session + memberships + workspaces), redirects to sign-in if unauthenticated, and
 * renders the responsive shell. Every dashboard route inherits this via the route
 * layout, so future modules mount inside it without change.
 */
export async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const ctx = await loadDashboardContext();
  if (!ctx) redirect('/login');

  return (
    <ToastProvider>
      <DashboardShell
        user={ctx.user}
        organizations={ctx.organizations}
        currentOrg={ctx.currentOrg}
        workspaces={ctx.workspaces}
        currentWorkspace={ctx.currentWorkspace}
      >
        {children}
      </DashboardShell>
    </ToastProvider>
  );
}
