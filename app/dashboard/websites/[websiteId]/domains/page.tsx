import * as React from 'react';
import { Link2 } from 'lucide-react';
import { Panel } from '@/components/ui/panel';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/websites/StatusBadge';
import { domainBadge } from '@/lib/websites/status';

/**
 * Domains tab — UI-only shell, ready for Phase 8.5. No DNS/SSL logic: table is empty
 * and connect is disabled. Establishes preview vs production domain layout.
 */
type Row = { id: string };
const columns: Column<Row>[] = [
  { key: 'domain', header: 'Domain' },
  { key: 'type', header: 'Type' },
  { key: 'dns', header: 'DNS' },
  { key: 'ssl', header: 'SSL' },
  { key: 'status', header: 'Status' },
  { key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right' },
];

function MiniCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-fg">{label}</p>
      <div className="mt-1 text-sm font-medium text-foreground">{value}</div>
    </Card>
  );
}

export default function WebsiteDomainsPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <MiniCard label="Production domain" value="—" />
        <MiniCard label="Preview domain" value="Auto-assigned on deploy" />
        <MiniCard label="Status" value={<StatusBadge badge={domainBadge()} />} />
      </div>

      <Panel
        title="Domains"
        description="Custom domains, DNS, and SSL"
        action={
          <Button size="sm" disabled title="Available in Phase 8.5">
            <Link2 aria-hidden />
            Connect domain
          </Button>
        }
        bodyClassName="p-0"
      >
        <DataTable
          columns={columns}
          rows={[]}
          getRowKey={(r) => r.id}
          empty="No domains connected — custom domains arrive in Phase 8.5."
        />
      </Panel>
    </div>
  );
}
