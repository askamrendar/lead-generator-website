import * as React from 'react';
import { KeyRound, Rocket, ScrollText } from 'lucide-react';
import { Panel } from '@/components/ui/panel';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { DataTable, type Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/websites/StatusBadge';
import { deploymentBadge } from '@/lib/websites/status';

/**
 * Deployment tab — UI-only shell, ready for Phase 8. No deployment logic: the tables
 * are empty and actions are disabled. Establishes the layout (status, history, env
 * vars, logs, rollback) so wiring a provider later is drop-in.
 */
type Row = { id: string };
const historyColumns: Column<Row>[] = [
  { key: 'version', header: 'Version' },
  { key: 'status', header: 'Status' },
  { key: 'provider', header: 'Provider' },
  { key: 'duration', header: 'Duration' },
  { key: 'created', header: 'Created' },
  { key: 'actions', header: <span className="sr-only">Rollback</span>, align: 'right' },
];

function MiniCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-fg">{label}</p>
      <div className="mt-1 text-sm font-medium text-foreground">{value}</div>
    </Card>
  );
}

export default function WebsiteDeploymentsPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <MiniCard label="Status" value={<StatusBadge badge={deploymentBadge()} />} />
        <MiniCard label="Provider" value="Not configured" />
        <MiniCard label="Last deployment" value="—" />
      </div>

      <Panel
        title="Deployments"
        description="Publish history and rollback"
        action={
          <Button size="sm" disabled title="Available in Phase 8">
            <Rocket aria-hidden />
            Deploy
          </Button>
        }
        bodyClassName="p-0"
      >
        <DataTable
          columns={historyColumns}
          rows={[]}
          getRowKey={(r) => r.id}
          empty="No deployments yet — publishing arrives in Phase 8."
        />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Environment variables"
          action={
            <Button size="sm" variant="outline" disabled title="Available in Phase 8">
              Add variable
            </Button>
          }
        >
          <EmptyState
            icon={KeyRound}
            title="No variables"
            description="Per-environment configuration will live here."
            className="border-0 py-6"
          />
        </Panel>
        <Panel title="Build logs">
          <EmptyState
            icon={ScrollText}
            title="No logs yet"
            description="Deployment and build logs will stream here."
            className="border-0 py-6"
          />
        </Panel>
      </div>
    </div>
  );
}
