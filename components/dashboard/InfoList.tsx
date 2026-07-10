import * as React from 'react';

/** Read-only key/value list (definition list) for settings + detail views. */
export function InfoList({ items }: { items: [string, React.ReactNode][] }) {
  return (
    <dl className="divide-y divide-border rounded-lg border border-border">
      {items.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
          <dt className="text-muted-fg">{label}</dt>
          <dd className="min-w-0 truncate text-right font-medium text-foreground">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
