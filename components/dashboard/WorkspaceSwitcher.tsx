'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Layers } from 'lucide-react';
import {
  Dropdown,
  DropdownItem,
  DropdownLabel,
} from '@/components/ui/dropdown';
import { switchWorkspace } from '@/lib/dashboard/actions';
import type { WorkspaceSummary } from '@/lib/dashboard/context';

/**
 * Switches the active workspace within the current organization. Persisted +
 * membership-validated server-side (via the tenant-access layer).
 */
export function WorkspaceSwitcher({
  workspaces,
  current,
}: {
  workspaces: WorkspaceSummary[];
  current: WorkspaceSummary | null;
}) {
  const [pending, startTransition] = React.useTransition();
  if (!current || workspaces.length === 0) return null;

  return (
    <Dropdown
      label="Workspaces"
      align="start"
      triggerClassName="inline-flex max-w-[11rem] items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      trigger={
        <>
          <Layers className="size-4 shrink-0 text-muted-fg" aria-hidden />
          <span className="truncate font-medium text-foreground">{current.name}</span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-fg" aria-hidden />
        </>
      }
    >
      <DropdownLabel>Workspaces</DropdownLabel>
      {workspaces.map((ws) => (
        <DropdownItem
          key={ws.id}
          onSelect={() =>
            ws.id !== current.id &&
            startTransition(() => {
              void switchWorkspace(ws.id);
            })
          }
          disabled={pending}
        >
          <Layers aria-hidden />
          <span className="flex-1 truncate">{ws.name}</span>
          {ws.id === current.id ? <Check className="text-brand" aria-hidden /> : null}
        </DropdownItem>
      ))}
    </Dropdown>
  );
}
