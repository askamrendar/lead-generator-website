'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Ban,
  ExternalLink,
  RotateCcw,
  RefreshCw,
  Rocket,
  ScrollText,
} from 'lucide-react';
import { Panel } from '@/components/ui/panel';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import type { DeploymentDTO, DeploymentConfig } from '@/lib/deployment/service';
import type { ProviderHealth } from '@/lib/deployment/types';
import {
  deployAction,
  retryAction,
  cancelAction,
  rollbackAction,
  saveConfigAction,
} from '@/app/dashboard/websites/[websiteId]/deployments/actions';

const STATUS_TONE: Record<string, string> = {
  READY: 'bg-green-500/15 text-green-700 dark:text-green-400',
  ERROR: 'bg-red-500/15 text-red-700 dark:text-red-400',
  QUEUED: 'bg-brand/15 text-brand',
  BUILDING: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  DEPLOYING: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  CANCELLED: 'bg-muted text-muted-fg',
  ROLLED_BACK: 'bg-muted text-muted-fg',
};

function StatusPill({ status }: { status: string }) {
  return (
    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', STATUS_TONE[status] ?? 'bg-muted text-muted-fg')}>
      {status.replace('_', ' ').toLowerCase()}
    </span>
  );
}

export function DeploymentDashboard({
  websiteId,
  deployments,
  config,
  health,
}: {
  websiteId: string;
  deployments: DeploymentDTO[];
  config: DeploymentConfig;
  health: ProviderHealth[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = React.useTransition();
  const [provider, setProvider] = React.useState<string>(config.provider ?? health[0]?.id ?? 'zip');
  const [environment, setEnvironment] = React.useState<'production' | 'preview'>('production');
  const [envText, setEnvText] = React.useState(
    Object.entries(config.envVars ?? {}).map(([k, v]) => `${k}=${v}`).join('\n'),
  );
  const [logsOf, setLogsOf] = React.useState<DeploymentDTO | null>(null);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    startTransition(async () => {
      const r = await fn();
      if (r.ok) { toast({ variant: 'success', title: success }); router.refresh(); }
      else toast({ variant: 'error', title: 'Action failed', description: r.error });
    });
  }

  function parseEnv(text: string): Record<string, string> {
    const out: Record<string, string> = {};
    for (const line of text.split('\n')) {
      const i = line.indexOf('=');
      if (i > 0) out[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
    return out;
  }

  const columns: Column<DeploymentDTO>[] = [
    { key: 'status', header: 'Status', render: (d) => <StatusPill status={d.status} /> },
    { key: 'provider', header: 'Provider' },
    { key: 'environment', header: 'Env' },
    { key: 'created', header: 'Created', render: (d) => <span className="text-muted-fg">{new Date(d.createdAt).toLocaleString()}</span> },
    { key: 'duration', header: 'Duration', render: (d) => <span className="text-muted-fg">{d.durationMs != null ? `${d.durationMs}ms` : '—'}</span> },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      align: 'right',
      render: (d) => (
        <div className="flex items-center justify-end gap-1">
          {d.url ? (
            <a href={d.url} target="_blank" rel="noreferrer" aria-label="Open deployment" className="rounded p-1.5 text-muted-fg hover:bg-muted hover:text-foreground"><ExternalLink className="size-4" aria-hidden /></a>
          ) : null}
          <button type="button" aria-label="Logs" onClick={() => setLogsOf(d)} className="rounded p-1.5 text-muted-fg hover:bg-muted hover:text-foreground"><ScrollText className="size-4" aria-hidden /></button>
          <button type="button" aria-label="Retry" disabled={pending} onClick={() => run(() => retryAction(websiteId, d.id), 'Redeploying')} className="rounded p-1.5 text-muted-fg hover:bg-muted hover:text-foreground disabled:opacity-40"><RefreshCw className="size-4" aria-hidden /></button>
          {['QUEUED', 'BUILDING', 'DEPLOYING'].includes(d.status) ? (
            <button type="button" aria-label="Cancel" disabled={pending} onClick={() => run(() => cancelAction(websiteId, d.id), 'Cancelled')} className="rounded p-1.5 text-muted-fg hover:bg-red-500/10 hover:text-red-600 disabled:opacity-40"><Ban className="size-4" aria-hidden /></button>
          ) : (
            <button type="button" aria-label="Rollback" disabled={pending} onClick={() => run(() => rollbackAction(websiteId, d.id), 'Rolled back')} className="rounded p-1.5 text-muted-fg hover:bg-muted hover:text-foreground disabled:opacity-40"><RotateCcw className="size-4" aria-hidden /></button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* New deployment */}
      <Panel title="Deploy" description="Publish this website to a provider">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-muted-fg">Provider</span>
            <select value={provider} onChange={(e) => setProvider(e.target.value)} className="h-10 rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
              {health.map((h) => (
                <option key={h.id} value={h.id}>{h.name}{h.configured ? '' : ' (not configured)'}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-muted-fg">Environment</span>
            <select value={environment} onChange={(e) => setEnvironment(e.target.value as 'production' | 'preview')} className="h-10 rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
              <option value="production">Production</option>
              <option value="preview">Preview</option>
            </select>
          </label>
          <Button disabled={pending} onClick={() => run(() => deployAction(websiteId, provider as never, environment), 'Deployment started')}>
            <Rocket aria-hidden /> Deploy
          </Button>
        </div>
      </Panel>

      {/* Provider health */}
      <Panel title="Providers" description="Provider registry & health">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {health.map((h) => (
            <Card key={h.id} className="flex items-center justify-between p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{h.name}</p>
                <p className="truncate text-xs text-muted-fg">{h.message}</p>
              </div>
              <span className={cn('ml-2 size-2.5 shrink-0 rounded-full', h.configured ? 'bg-green-500' : 'bg-muted-fg/40')} aria-label={h.configured ? 'configured' : 'not configured'} />
            </Card>
          ))}
        </div>
      </Panel>

      {/* Environment variables */}
      <Panel
        title="Environment variables"
        description="KEY=VALUE per line — used by providers that need credentials"
        action={
          <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => saveConfigAction(websiteId, { provider: provider as never, envVars: parseEnv(envText) }), 'Saved')}>
            Save
          </Button>
        }
      >
        <textarea
          value={envText}
          onChange={(e) => setEnvText(e.target.value)}
          placeholder="VERCEL_TOKEN=…"
          className="min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand"
        />
      </Panel>

      {/* History / timeline */}
      <Panel title="Deployment history" bodyClassName="p-0">
        <DataTable columns={columns} rows={deployments} getRowKey={(d) => d.id} empty="No deployments yet." />
      </Panel>

      <Modal open={logsOf !== null} onClose={() => setLogsOf(null)} title="Deployment logs">
        <pre className="max-h-80 overflow-auto rounded-md bg-muted p-3 text-xs text-foreground">
          {(logsOf?.logs ?? []).join('\n') || 'No logs.'}
          {logsOf?.error ? `\n\nError: ${logsOf.error}` : ''}
        </pre>
      </Modal>
    </div>
  );
}
