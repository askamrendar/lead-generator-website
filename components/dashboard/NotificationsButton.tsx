'use client';

import * as React from 'react';
import { Bell } from 'lucide-react';
import { Dropdown, DropdownLabel } from '@/components/ui/dropdown';
import { EmptyState } from '@/components/ui/empty-state';

/**
 * Notifications bell — placeholder. The panel and the config-driven feed arrive with
 * a later milestone; today it shows an empty state. Kept as a real extension point so
 * the header layout is final.
 */
export function NotificationsButton() {
  return (
    <Dropdown
      label="Notifications"
      align="end"
      triggerClassName="relative inline-flex size-9 items-center justify-center rounded-md text-muted-fg transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      menuClassName="w-72"
      trigger={
        <>
          <Bell className="size-4" aria-hidden />
          <span className="sr-only">Notifications</span>
        </>
      }
    >
      <DropdownLabel>Notifications</DropdownLabel>
      <div className="p-2">
        <EmptyState
          icon={Bell}
          title="You're all caught up"
          description="Activity and alerts will appear here."
          className="border-0 px-2 py-6"
        />
      </div>
    </Dropdown>
  );
}
