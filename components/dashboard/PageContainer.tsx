import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Vertical rhythm wrapper for a dashboard page's sections (header + content). The
 * shell already constrains max width; this just stacks sections consistently.
 */
export function PageContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('space-y-6', className)}>{children}</div>;
}
