'use client';

import { useState, useTransition } from 'react';
import { RefreshCw, RotateCcw, XCircle, CheckCircle2, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { retryJobAction, cancelJobAction } from '@/app/dashboard/jobs/actions';

interface QueueHealth {
  queue: string;
  queued: number;
  running: number;
  succeeded: number;
  failed: number;
}
interface JobRow {
  id: string;
  queue: string;
  type: string;
  status: string;
  attempts: number;
  maxAttempts: number;
  error: string | null;
  createdAt: string | Date;
}
interface Props {
  queues: QueueHealth[];
  recent: JobRow[];
  totals: Record<string, number>;
  workerConfigured: boolean;
}

const STATUS_BADGE: Record<string, { variant: 'brand' | 'accent' | 'muted' | 'outline'; icon: typeof Clock }> = {
  QUEUED: { variant: 'outline', icon: Clock },
  RUNNING: { variant: 'accent', icon: Loader2 },
  SUCCEEDED: { variant: 'brand', icon: CheckCircle2 },
  FAILED: { variant: 'muted', icon: AlertTriangle },
  CANCELLED: { variant: 'muted', icon: XCircle },
};

export function QueueDashboard({ queues, recent, totals, workerConfigured }: Props) {
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  function act(id: string, fn: (id: string) => Promise<unknown>) {
    setBusyId(id);
    startTransition(async () => {
      await fn(id);
      setBusyId(null);
    });
  }

  const totalFailed = totals.FAILED ?? 0;

  return (
    <div className="space-y-6">
      {!workerConfigured && (
        <Card className="border-amber-500/40 bg-amber-500/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden />
            <div className="text-sm">
              <p className="font-semibold text-foreground">Worker awaiting configuration</p>
              <p className="mt-1 text-muted-fg">
                Jobs are queued durably, but no worker is running. Set{' '}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">JOBS_WORKER_TOKEN</code> and schedule a periodic
                call to <code className="rounded bg-muted px-1 py-0.5 text-xs">POST /api/jobs/run</code> (e.g. Vercel Cron)
                to begin processing.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Totals */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        {(['QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED'] as const).map((s) => (
          <Card key={s} className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-fg">{s.toLowerCase()}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{totals[s] ?? 0}</p>
          </Card>
        ))}
      </div>

      {/* Per-queue health */}
      <Card className="overflow-hidden">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold text-foreground">Queue Health</h2>
        </div>
        <div className="divide-y divide-border">
          {queues.map((q) => {
            const active = q.queued + q.running;
            return (
              <div key={q.queue} className="flex items-center justify-between gap-4 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{q.queue}</p>
                  <p className="text-xs text-muted-fg">
                    {q.succeeded} done · {q.failed} failed
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant={active > 0 ? 'accent' : 'muted'}>{active} active</Badge>
                  {q.failed > 0 && <Badge variant="outline">{q.failed} failed</Badge>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Recent job history */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold text-foreground">
            Job History {totalFailed > 0 && <span className="text-muted-fg">· {totalFailed} failed</span>}
          </h2>
          <RefreshCw className="size-4 text-muted-fg" aria-hidden />
        </div>
        {recent.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-fg">No jobs yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {recent.map((j) => {
              const badge = STATUS_BADGE[j.status] ?? STATUS_BADGE.QUEUED;
              const Icon = badge.icon;
              return (
                <div key={j.id} className="flex items-center justify-between gap-4 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={badge.variant}>
                        <Icon className={`size-3 ${j.status === 'RUNNING' ? 'animate-spin' : ''}`} aria-hidden />
                        {j.status.toLowerCase()}
                      </Badge>
                      <span className="truncate text-sm font-medium text-foreground">{j.type}</span>
                      <span className="text-xs text-muted-fg">{j.queue}</span>
                    </div>
                    {j.error && <p className="mt-1 truncate text-xs text-red-600 dark:text-red-400" title={j.error}>{j.error}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs tabular-nums text-muted-fg">
                      {j.attempts}/{j.maxAttempts}
                    </span>
                    {j.status === 'FAILED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending && busyId === j.id}
                        onClick={() => act(j.id, retryJobAction)}
                      >
                        <RotateCcw className="size-3.5" aria-hidden /> Retry
                      </Button>
                    )}
                    {j.status === 'QUEUED' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={pending && busyId === j.id}
                        onClick={() => act(j.id, cancelJobAction)}
                      >
                        <XCircle className="size-3.5" aria-hidden /> Cancel
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
