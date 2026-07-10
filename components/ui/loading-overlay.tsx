import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Covers its nearest positioned ancestor with a translucent veil + spinner while a
 * section is busy. Wrap a relatively-positioned container and toggle `show`.
 */
export function LoadingOverlay({
  show,
  label = 'Loading…',
  className,
}: {
  show: boolean;
  label?: string;
  className?: string;
}) {
  if (!show) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-background/70 backdrop-blur-sm',
        className,
      )}
    >
      <Loader2 className="size-6 animate-spin text-brand" aria-hidden />
      <span className="text-sm text-muted-fg">{label}</span>
    </div>
  );
}
