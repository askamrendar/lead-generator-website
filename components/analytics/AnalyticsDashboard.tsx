'use client';

import * as React from 'react';
import Link from 'next/link';
import { Download, FileDown, Gauge } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Panel } from '@/components/ui/panel';
import { Button } from '@/components/ui/button';
import { TrendChart } from '@/components/analytics/TrendChart';
import { toCsv } from '@/lib/analytics/csv';
import { cn } from '@/lib/utils';
import type { AnalyticsSummary } from '@/lib/analytics/types';

const RANGES = [7, 14, 30, 90];

/**
 * Analytics dashboard (client for export + range links). Real internal metrics +
 * deployment trend; external sources (GA4/GSC) shown with their Awaiting-Credentials
 * state. CSV export builds a Blob; PDF export uses the browser print path.
 */
export function AnalyticsDashboard({
  summary,
  basePath,
}: {
  summary: AnalyticsSummary;
  basePath: string;
}) {
  function exportCsv() {
    const rows = [
      ...summary.tiles.map((t) => ({ metric: t.label, value: t.value })),
      ...summary.deploymentTrend.map((p) => ({ metric: `deployments ${p.date}`, value: p.value })),
    ];
    const blob = new Blob([toCsv(rows, ['metric', 'value'])], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${summary.scope}-${summary.rangeDays}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Range + exports */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
          {RANGES.map((r) => (
            <Link
              key={r}
              href={`${basePath}?range=${r}`}
              className={cn('rounded px-2.5 py-1 text-xs font-medium', r === summary.rangeDays ? 'bg-muted text-foreground' : 'text-muted-fg hover:bg-muted')}
            >
              {r}d
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={exportCsv}><Download aria-hidden /> CSV</Button>
          <Button size="sm" variant="outline" onClick={() => window.print()}><FileDown aria-hidden /> PDF</Button>
        </div>
      </div>

      {/* Real metric tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {summary.tiles.map((t) => (
          <Card key={t.key} className="p-4">
            <p className="text-xs text-muted-fg">{t.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{t.value}</p>
            {t.hint ? <p className="mt-0.5 text-[11px] text-muted-fg">{t.hint}</p> : null}
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Deployment activity" description={`Last ${summary.rangeDays} days`} className="lg:col-span-2">
          <TrendChart points={summary.deploymentTrend} label="Deployments" />
        </Panel>
        <Panel title="Website health">
          <div className="flex items-center gap-3">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted text-lg font-semibold text-foreground">{summary.health.score}</div>
            <div>
              <p className="text-sm font-medium text-foreground">{summary.health.label}</p>
              <p className="text-xs text-muted-fg">Health score</p>
            </div>
          </div>
          <ul className="mt-3 space-y-1.5">
            {summary.health.factors.map((f) => (
              <li key={f.label} className="flex items-center gap-2 text-xs">
                <span className={cn('size-2 rounded-full', f.ok ? 'bg-green-500' : 'bg-muted-fg/40')} aria-hidden />
                <span className={f.ok ? 'text-foreground' : 'text-muted-fg'}>{f.label}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* External sources */}
      <Panel title="Traffic & rankings" description="Google Analytics 4 · Search Console">
        <div className="grid gap-3 sm:grid-cols-2">
          {summary.external.map((e) => (
            <Card key={e.id} className="flex items-start justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{e.name}</p>
                <p className="text-xs text-muted-fg">{e.message}</p>
              </div>
              <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase', e.configured ? 'bg-green-500/15 text-green-700 dark:text-green-400' : 'bg-amber-500/15 text-amber-700 dark:text-amber-400')}>
                {e.configured ? 'Connected' : 'Awaiting credentials'}
              </span>
            </Card>
          ))}
        </div>
        <p className="mt-3 flex items-center gap-2 text-xs text-muted-fg">
          <Gauge className="size-3.5" aria-hidden />
          Traffic, sessions, keyword rankings, and Core Web Vitals populate once GA4 / Search Console credentials are added (Settings → API Keys, Phase 10).
        </p>
      </Panel>
    </div>
  );
}
