import * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * KPI tile: label + value + icon, with an optional hint line. Presentational — feed
 * it real numbers once analytics land; today the dashboard passes placeholders.
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  className,
}: {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  hint?: string;
  className?: string;
}) {
  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-fg">{label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
            {value}
          </p>
          {hint ? <p className="mt-1 text-xs text-muted-fg">{hint}</p> : null}
        </div>
        {Icon ? (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-fg">
            <Icon className="size-5" aria-hidden />
          </div>
        ) : null}
      </div>
    </Card>
  );
}
