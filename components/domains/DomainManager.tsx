'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { BadgeCheck, ChevronDown, Copy as CopyIcon, Globe, Plus, Star, Trash2 } from 'lucide-react';
import { Panel } from '@/components/ui/panel';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import type { DomainDTO, DomainProviderHealth, DomainProviderId } from '@/lib/domains/types';
import {
  addDomainAction,
  verifyDomainAction,
  setPrimaryAction,
  removeDomainAction,
} from '@/app/dashboard/websites/[websiteId]/domains/actions';

const STATUS_TONE: Record<string, string> = {
  ACTIVE: 'bg-green-500/15 text-green-700 dark:text-green-400',
  PENDING: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  VERIFYING: 'bg-brand/15 text-brand',
  ERROR: 'bg-red-500/15 text-red-700 dark:text-red-400',
};

export function DomainManager({
  websiteId,
  domains,
  health,
}: {
  websiteId: string;
  domains: DomainDTO[];
  health: DomainProviderHealth[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = React.useTransition();
  const [hostname, setHostname] = React.useState('');
  const [provider, setProvider] = React.useState<DomainProviderId>('custom');
  const [expanded, setExpanded] = React.useState<string | null>(domains[0]?.id ?? null);
  const [removeId, setRemoveId] = React.useState<string | null>(null);

  function run(fn: () => Promise<{ ok: boolean; error?: string; message?: string }>, success: string) {
    startTransition(async () => {
      const r = await fn();
      if (r.ok) { toast({ variant: 'success', title: success, description: r.message }); router.refresh(); }
      else toast({ variant: 'error', title: 'Action failed', description: r.error });
    });
  }

  return (
    <div className="space-y-6">
      <Panel title="Connect a domain" description="Point a custom domain at this website">
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-0 flex-1 text-sm">
            <span className="mb-1 block text-xs font-medium text-muted-fg">Domain</span>
            <Input value={hostname} onChange={(e) => setHostname(e.target.value)} placeholder="example.com" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-muted-fg">DNS provider</span>
            <select value={provider} onChange={(e) => setProvider(e.target.value as DomainProviderId)} className="h-11 rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
              {health.map((h) => <option key={h.id} value={h.id}>{h.name}{h.configured || h.id === 'custom' ? '' : ' (not configured)'}</option>)}
            </select>
          </label>
          <Button
            disabled={pending || !hostname.trim()}
            onClick={() => run(async () => { const r = await addDomainAction(websiteId, hostname.trim(), provider); if (r.ok) setHostname(''); return r; }, 'Domain added')}
          >
            <Plus aria-hidden /> Add
          </Button>
        </div>
      </Panel>

      {domains.length === 0 ? (
        <EmptyState icon={Globe} title="No domains connected" description="Add a custom domain above to verify DNS and enable SSL." />
      ) : (
        <div className="space-y-3">
          {domains.map((d) => (
            <Card key={d.id} className="overflow-hidden">
              <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                <Globe className="size-4 shrink-0 text-muted-fg" aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium text-foreground">{d.hostname}</span>
                    {d.isPrimary ? <span className="inline-flex items-center gap-0.5 rounded bg-brand/15 px-1.5 py-0.5 text-[10px] font-semibold text-brand"><Star className="size-3" aria-hidden /> Primary</span> : null}
                  </div>
                  <p className="text-xs text-muted-fg">SSL: {d.sslStatus} · {d.verified ? 'verified' : 'unverified'}</p>
                </div>
                <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_TONE[d.status] ?? 'bg-muted text-muted-fg')}>{d.status.toLowerCase()}</span>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => verifyDomainAction(websiteId, d.id), d.verified ? 'Re-checked' : 'Verification checked')}>
                    <BadgeCheck aria-hidden /> Verify
                  </Button>
                  {!d.isPrimary ? (
                    <button type="button" aria-label="Set primary" disabled={pending} onClick={() => run(() => setPrimaryAction(websiteId, d.id), 'Primary domain set')} className="rounded p-1.5 text-muted-fg hover:bg-muted hover:text-foreground disabled:opacity-40"><Star className="size-4" aria-hidden /></button>
                  ) : null}
                  <button type="button" aria-label="Remove domain" disabled={pending} onClick={() => setRemoveId(d.id)} className="rounded p-1.5 text-muted-fg hover:bg-red-500/10 hover:text-red-600 disabled:opacity-40"><Trash2 className="size-4" aria-hidden /></button>
                  <button type="button" aria-label="DNS records" onClick={() => setExpanded(expanded === d.id ? null : d.id)} className="rounded p-1.5 text-muted-fg hover:bg-muted hover:text-foreground"><ChevronDown className={cn('size-4 transition-transform', expanded === d.id && 'rotate-180')} aria-hidden /></button>
                </div>
              </div>
              {expanded === d.id ? (
                <div className="border-t border-border bg-muted/30 px-4 py-3">
                  <p className="mb-2 text-xs font-medium text-muted-fg">Add these DNS records at your DNS provider (Cloudflare recommended):</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="text-muted-fg">
                        <tr><th className="py-1 pr-4">Type</th><th className="py-1 pr-4">Name</th><th className="py-1 pr-4">Value</th><th className="py-1 pr-2"><span className="sr-only">Copy</span></th></tr>
                      </thead>
                      <tbody className="font-mono">
                        {d.records.map((r, i) => (
                          <tr key={i} className="border-t border-border">
                            <td className="py-1 pr-4">{r.type}</td>
                            <td className="py-1 pr-4 break-all">{r.name}</td>
                            <td className="py-1 pr-4 break-all">{r.value}</td>
                            <td className="py-1 pr-2">
                              <button
                                type="button"
                                aria-label={`Copy ${r.type} record value`}
                                onClick={() => { void navigator.clipboard.writeText(r.value); toast({ variant: 'success', title: 'Copied' }); }}
                                className="rounded p-1 text-muted-fg hover:bg-muted hover:text-foreground"
                              >
                                <CopyIcon className="size-3.5" aria-hidden />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-3 space-y-1.5 text-xs text-muted-fg">
                    <p>
                      <strong className="text-foreground">Cloudflare:</strong> add the records above in DNS → Records. Cloudflare
                      flattens the apex CNAME automatically. Start with the cloud icon grey (DNS only) until the domain
                      verifies; you can enable the orange-cloud proxy afterwards.
                    </p>
                    <p>
                      <strong className="text-foreground">Host it yourself instead:</strong> download the website ZIP
                      (Overview → Download ZIP), upload it to any static host or your own server, and point your
                      domain&apos;s A/CNAME records at that server — no records here needed in that case.
                    </p>
                  </div>
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      )}

      <Panel title="DNS providers" description="Provider registry & health">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {health.map((h) => (
            <Card key={h.id} className="flex items-center justify-between p-3">
              <div className="min-w-0"><p className="truncate text-sm font-medium text-foreground">{h.name}</p><p className="truncate text-xs text-muted-fg">{h.message}</p></div>
              <span className={cn('ml-2 size-2.5 shrink-0 rounded-full', h.configured ? 'bg-green-500' : 'bg-muted-fg/40')} aria-hidden />
            </Card>
          ))}
        </div>
      </Panel>

      <ConfirmDialog
        open={removeId !== null}
        onClose={() => setRemoveId(null)}
        onConfirm={async () => { if (removeId) { const r = await removeDomainAction(websiteId, removeId); if (r.ok) { toast({ variant: 'success', title: 'Domain removed' }); router.refresh(); } else toast({ variant: 'error', title: 'Remove failed', description: r.error }); } }}
        title="Remove domain?"
        description="This disconnects the domain from this website."
        confirmLabel="Remove"
        destructive
      />
    </div>
  );
}
