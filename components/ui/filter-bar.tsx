import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Toolbar row above a list/table: search on the left, filters/actions on the right.
 * Purely a layout container — modules drop a SearchInput + their own controls in.
 */
export function FilterBar({
  children,
  end,
  className,
}: {
  children?: React.ReactNode;
  end?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="flex flex-1 flex-wrap items-center gap-2">{children}</div>
      {end ? <div className="flex items-center gap-2">{end}</div> : null}
    </div>
  );
}
