'use client';

import * as React from 'react';
import { Building2, Check, ChevronsUpDown } from 'lucide-react';
import {
  Dropdown,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
} from '@/components/ui/dropdown';
import { switchOrganization } from '@/lib/dashboard/actions';
import type { OrgSummary } from '@/lib/dashboard/context';
import { cn } from '@/lib/utils';

/**
 * Switches the active organization. Selection is persisted server-side (validated
 * through the tenant-access layer in the action), so the whole dashboard re-scopes.
 */
export function OrganizationSwitcher({
  organizations,
  current,
}: {
  organizations: OrgSummary[];
  current: OrgSummary | null;
}) {
  const [pending, startTransition] = React.useTransition();
  if (!current) return null;

  // Single-user SaaS: with one organization there is nothing to switch. Show the org
  // name as a static, non-interactive label (settings remain reachable via the nav).
  if (organizations.length <= 1) {
    return (
      <span className="inline-flex max-w-[12rem] items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm">
        <Building2 className="size-4 shrink-0 text-muted-fg" aria-hidden />
        <span className="truncate font-medium text-foreground">{current.name}</span>
      </span>
    );
  }

  return (
    <Dropdown
      label="Organizations"
      align="start"
      triggerClassName="inline-flex max-w-[12rem] items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-60"
      trigger={
        <>
          <Building2 className="size-4 shrink-0 text-muted-fg" aria-hidden />
          <span className="truncate font-medium text-foreground">{current.name}</span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-fg" aria-hidden />
        </>
      }
    >
      <DropdownLabel>Organizations</DropdownLabel>
      {organizations.map((org) => (
        <DropdownItem
          key={org.id}
          onSelect={() =>
            org.id !== current.id &&
            startTransition(() => {
              void switchOrganization(org.id);
            })
          }
          disabled={pending}
        >
          <Building2 aria-hidden />
          <span className="flex-1 truncate">{org.name}</span>
          {org.id === current.id ? <Check className="text-brand" aria-hidden /> : null}
        </DropdownItem>
      ))}
      <DropdownSeparator />
      <DropdownItem href="/dashboard/settings">
        <span className={cn('flex-1')}>Organization settings</span>
      </DropdownItem>
    </Dropdown>
  );
}
