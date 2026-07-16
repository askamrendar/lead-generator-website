import Link from 'next/link';
import { Link2, ArrowRight, Plus } from 'lucide-react';
import { loadDashboardContext } from '@/lib/dashboard/context';
import { listWorkspaceWebsites } from '@/lib/websites/service';
import { listDomains } from '@/lib/domains/service';
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
 * Workspace Domains hub — every website with its connected domains, linking to
 * the per-website Domains tab (connect / verify / SSL). Guarded services only.
 */
export default async function DomainsPage() {
  const ctx = await loadDashboardContext();
  const ws = ctx?.currentWorkspace;
  const websites = ws ? await listWorkspaceWebsites(ws.id) : [];

  const domainsBysite = new Map<string, Array<{ hostname: string; verified: boolean }>>();
  for (const w of websites.slice(0, 25)) {
    const rows = await listDomains(w.id);
    domainsBysite.set(w.id, rows.map((d) => ({ hostname: d.hostname, verified: d.verified })));
  }

  return (
    <PageContainer>
      <PageHeader title="Domains" description="Connect custom domains and manage DNS and SSL." />
      {websites.length === 0 ? (
        <EmptyState
          icon={Link2}
          title="No websites yet"
          description="Create a website first — then connect its custom domain."
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
            const domains = domainsBysite.get(w.id) ?? [];
            return (
              <div key={w.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{w.name}</p>
                  <p className="truncate text-xs text-muted-fg">
                    {domains.length > 0 ? domains.map((d) => d.hostname).join(', ') : 'No custom domain connected'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <StatusBadge badge={lifecycleBadge(w)} />
                  {domains.some((d) => d.verified) ? <Badge variant="brand">verified</Badge> : null}
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dashboard/websites/${w.id}/domains`}>
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
