'use client';

import * as React from 'react';
import { LogOut, Settings, UserCircle } from 'lucide-react';
import {
  Dropdown,
  DropdownItem,
  DropdownSeparator,
} from '@/components/ui/dropdown';

/** Two-letter avatar initials from a name or email. */
function initials(name: string | null, email: string | null): string {
  const source = (name && name.trim()) || email || '?';
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  const letters = parts.length >= 2 ? parts[0]![0]! + parts[1]![0]! : source.slice(0, 2);
  return letters.toUpperCase();
}

/**
 * Account avatar + profile menu. Profile is a placeholder route today; sign-out uses
 * the /logout page (which clears the session). Reuses the Dropdown primitive.
 */
export function UserMenu({
  name,
  email,
}: {
  name: string | null;
  email: string | null;
}) {
  return (
    <Dropdown
      label="Account"
      align="end"
      triggerClassName="flex size-9 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-fg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
      trigger={
        <>
          <span aria-hidden>{initials(name, email)}</span>
          <span className="sr-only">Open account menu</span>
        </>
      }
    >
      <div className="px-2.5 py-2">
        <p className="truncate text-sm font-medium text-foreground">{name ?? 'Account'}</p>
        {email ? <p className="truncate text-xs text-muted-fg">{email}</p> : null}
      </div>
      <DropdownSeparator />
      <DropdownItem href="/dashboard/settings">
        <UserCircle aria-hidden />
        Profile
      </DropdownItem>
      <DropdownItem href="/dashboard/settings">
        <Settings aria-hidden />
        Settings
      </DropdownItem>
      <DropdownSeparator />
      <DropdownItem href="/logout" destructive>
        <LogOut aria-hidden />
        Sign out
      </DropdownItem>
    </Dropdown>
  );
}
