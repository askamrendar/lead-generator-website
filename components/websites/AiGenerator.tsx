'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2, CheckCircle2, AlertTriangle, RotateCcw, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { startGenerationAction } from '@/app/dashboard/websites/[websiteId]/ai-generator/actions';
import { retryJobAction, cancelJobAction } from '@/app/dashboard/jobs/actions';

interface JobRow {
  id: string;
  status: string;
  attempts: number;
  maxAttempts: number;
  error: string | null;
  createdAt: string | Date;
}

interface Props {
  websiteId: string;
  status: string; // Website.status
  jobs: JobRow[];
  workerConfigured: boolean;
}

const STATUS_META: Record<string, { label: string; variant: 'brand' | 'accent' | 'muted' | 'outline'; icon: typeof Loader2; spin?: boolean }> = {
  QUEUED: { label: 'Queued', variant: 'outline', icon: Loader2, spin: true },
  RUNNING: { label: 'Generating', variant: 'accent', icon: Loader2, spin: true },
  SUCCEEDED: { label: 'Completed', variant: 'brand', icon: CheckCircle2 },
  FAILED: { label: 'Failed', variant: 'muted', icon: AlertTriangle },
  CANCELLED: { label: 'Cancelled', variant: 'muted', icon: XCircle },
};

/**
 * AI Generator UI (Task 1). Starts an async `website.generate` job (Phase 8.5 queue),
 * shows live progress by polling while a job is active, and lists generation history.
 * All generation logic lives in the existing engines/services — this is UI only.
 */
export function AiGenerator({ websiteId, status, jobs, workerConfigured }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = React.useTransition();

  const active = jobs.find((j) => j.status === 'QUEUED' || j.status === 'RUNNING');
  const last = jobs[0];

  // Poll for progress while a job is active (the worker updates the row out-of-band).
  React.useEffect(() => {
    if (!active) return;
    const t = setInterval(() => router.refresh(), 3000);
    return () => clearInterval(t);
  }, [active, router]);

  function start() {
    startTransition(async () => {
      const res = await startGenerationAction(websiteId);
      if (res.ok) {
        toast({ variant: 'success', title: 'Generation started', description: 'Your website is being generated.' });
        router.refresh();
      } else {
        toast({ variant: 'error', title: 'Could not start', description: res.error });
      }
    });
  }

  function act(id: string, fn: (id: string) => Promise<unknown>, label: string) {
    startTransition(async () => {
      await fn(id);
      toast({ variant: 'success', title: label });
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <Sparkles className="size-6" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-foreground">AI Website Generator</h2>
            <p className="mt-1 text-sm text-muted-fg">
              Generate a complete website from this business&apos;s configuration — the AI picks a template,
              theme, and industry, composes the pages, and opens them in the Visual Builder. Runs in the
              background so you can keep working.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button onClick={start} disabled={pending || Boolean(active)}>
                {active ? <Loader2 className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />}
                {active ? 'Generating…' : status === 'DRAFT' ? 'Generate website' : 'Regenerate website'}
              </Button>
              {status === 'GENERATED' || status === 'PUBLISHED' ? (
                <Badge variant="brand"><CheckCircle2 className="size-3" aria-hidden /> {status.toLowerCase()}</Badge>
              ) : null}
            </div>

            {!workerConfigured && (
              <p className="mt-3 flex items-start gap-2 text-xs text-amber-600">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                Background worker not configured (set <code className="rounded bg-muted px-1">JOBS_WORKER_TOKEN</code> and
                schedule <code className="rounded bg-muted px-1">POST /api/jobs/run</code>). Jobs will queue but won&apos;t
                process until a worker runs.
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Active progress */}
      {active && (
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <Loader2 className="size-5 animate-spin text-accent" aria-hidden />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {active.status === 'RUNNING' ? 'Generating your website…' : 'Queued — waiting for a worker…'}
              </p>
              <p className="text-xs text-muted-fg">Attempt {active.attempts}/{active.maxAttempts}. This updates automatically.</p>
            </div>
            {active.status === 'QUEUED' && (
              <Button size="sm" variant="ghost" disabled={pending} onClick={() => act(active.id, cancelJobAction, 'Generation cancelled')}>
                <XCircle aria-hidden /> Cancel
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Last failure with retry */}
      {last?.status === 'FAILED' && (
        <Card className="border-red-500/30 p-5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="size-5 text-red-600 dark:text-red-400" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">Last generation failed</p>
              {last.error && <p className="truncate text-xs text-red-600 dark:text-red-400" title={last.error}>{last.error}</p>}
            </div>
            <Button size="sm" variant="outline" disabled={pending} onClick={() => act(last.id, retryJobAction, 'Retrying generation')}>
              <RotateCcw aria-hidden /> Retry
            </Button>
          </div>
        </Card>
      )}

      {/* History */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Generation history</h3>
        {jobs.length === 0 ? (
          <EmptyState icon={Sparkles} title="No generations yet" description="Generate this website to see its history here." />
        ) : (
          <Card className="divide-y divide-border overflow-hidden">
            {jobs.map((j) => {
              const meta = STATUS_META[j.status] ?? STATUS_META.QUEUED;
              const Icon = meta.icon;
              return (
                <div key={j.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={meta.variant}>
                      <Icon className={`size-3 ${meta.spin ? 'animate-spin' : ''}`} aria-hidden /> {meta.label}
                    </Badge>
                    <span className="text-xs text-muted-fg">{new Date(j.createdAt).toLocaleString()}</span>
                  </div>
                  <span className="text-xs tabular-nums text-muted-fg">{j.attempts}/{j.maxAttempts}</span>
                </div>
              );
            })}
          </Card>
        )}
      </div>
    </div>
  );
}
