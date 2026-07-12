'use client';

import * as React from 'react';
import type { DeviceMode } from '@/lib/builder/editor/types';
import { cn } from '@/lib/utils';

/** Constrains the preview to a device width so users can check responsive layouts. */
const WIDTHS: Record<DeviceMode, string> = {
  desktop: '100%',
  tablet: '820px',
  mobile: '390px',
};

export function DeviceFrame({
  device,
  children,
}: {
  device: DeviceMode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-center overflow-auto bg-muted/40 p-4">
      <div
        className={cn(
          'mx-auto w-full origin-top overflow-hidden rounded-lg border border-border bg-background shadow-sm transition-[max-width] duration-200',
          device !== 'desktop' && 'my-2',
        )}
        style={{ maxWidth: WIDTHS[device] }}
      >
        {children}
      </div>
    </div>
  );
}
