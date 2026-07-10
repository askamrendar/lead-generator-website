import * as React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Titled content panel — a Card with a header row (title + optional "view all" link
 * or action) and a body. The building block for dashboard sections; reused by home,
 * settings, and future modules. Presentational.
 */
export function Panel({
  title,
  description,
  action,
  viewAllHref,
  viewAllLabel = 'View all',
  children,
  className,
  bodyClassName,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  viewAllHref?: string;
  viewAllLabel?: string;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <Card className={cn('flex flex-col', className)}>
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {description ? <p className="text-xs text-muted-fg">{description}</p> : null}
        </div>
        {action ??
          (viewAllHref ? (
            <Link
              href={viewAllHref}
              className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-brand hover:underline"
            >
              {viewAllLabel}
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          ) : null)}
      </div>
      <div className={cn('flex-1 p-5', bodyClassName)}>{children}</div>
    </Card>
  );
}
