import * as React from 'react';

/** Labeled horizontal rule ("— or continue with email —") between OAuth and form. */
export function AuthDivider({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-border" />
      <span className="text-xs uppercase tracking-wide text-muted-fg">{children}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
