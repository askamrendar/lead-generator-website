import Link from 'next/link';
import { Rocket, ArrowRight, Plus } from 'lucide-react';
import { loadDashboardContext } from '@/lib/dashboard/context';
import { listWorkspaceWebsites } from '@/lib/websites/service';
import { listDeployments } from '@/lib/deployment/service';
import { lifecycleBadge } from '@/lib/websites/status';
import { PageContainer } from '@/components/dashboard/PageContainer';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/websites/StatusBadge';

export const dynamic = 'force-dynamic';

/**
 * Workspace Deployments hub — every website with its latest deployment state,
 * linking into the per-website Deployments tab (where deploys run async on the
 * job queue). Reads go through the tenant-access-guarded services only.
 */
export default async function DeploymentsPage() {
  const ctx = await loadDashboardContext();
  const ws = ctx?.currentWorkspace;
  const websites = ws ? await listWorkspaceWebsites(ws.id) : [];

  // Latest deployment per website (guarded service; small lists — fine serially).
  const latest = new Map<string, { status: string; createdAt: string } | null>();
  for (const w of websites.slice(0, 25)) {
    const rows = await listDeployments(w.id);
    latest.set(w.id, rows[0] ? { status: rows[0].status, createdAt: rows[0].createdAt } : null);
  }

  return (
    <PageContainer>
      <PageHeader title="Deployments" description="Publish websites and track deployment status." />
      {websites.length === 0 ? (
        <EmptyState
          icon={Rocket}
          title="Nothing to deploy yet"
          description="Create and generate a website, then publish it from its Deployments tab."
          action={
            <Button asChild>
              <Link href="/dashboard/websites/new">
                <Plus aria-hidden /> New website
              </Link>
            </Button>
          }
        />
      ) : (
        <Card className="divide-y divide-border overflow-hidden">
          {websites.map((w) => {
            const dep = latest.get(w.id);
            return (
              <div key={w.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{w.name}</p>
                  <p className="truncate text-xs text-muted-fg">
                    {dep
                      ? `Last deployment: ${dep.status.toLowerCase()} · ${new Date(dep.createdAt).toLocaleString()}`
                      : 'Never deployed'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <StatusBadge badge={lifecycleBadge(w)} />
                  {dep ? <Badge variant={dep.status === 'READY' ? 'brand' : 'muted'}>{dep.status.toLowerCase()}</Badge> : null}
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dashboard/websites/${w.id}/deployments`}>
                      Manage <ArrowRight aria-hidden />
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </PageContainer>
  );
}
