'use client';

import * as React from 'react';
import { MoreHorizontal, type LucideIcon } from 'lucide-react';
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/dropdown';

/**
 * Row/card action menu (the "⋯" overflow). Config-driven items; composes the
 * Dropdown primitive so behavior/ARIA stay consistent everywhere.
 */
export interface ActionItem {
  label: string;
  icon?: LucideIcon;
  href?: string;
  onSelect?: () => void;
  destructive?: boolean;
  disabled?: boolean;
  /** Insert a separator before this item. */
  separatorBefore?: boolean;
}

export function ActionMenu({ items, label = 'Actions' }: { items: ActionItem[]; label?: string }) {
  return (
    <Dropdown
      label={label}
      align="end"
      triggerClassName="inline-flex size-8 items-center justify-center rounded-md text-muted-fg transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      trigger={
        <>
          <MoreHorizontal className="size-4" aria-hidden />
          <span className="sr-only">{label}</span>
        </>
      }
    >
      {items.map((item, i) => (
        <React.Fragment key={item.label}>
          {item.separatorBefore && i > 0 ? <DropdownSeparator /> : null}
          <DropdownItem
            href={item.href}
            onSelect={item.onSelect}
            disabled={item.disabled}
            destructive={item.destructive}
          >
            {item.icon ? <item.icon aria-hidden /> : null}
            {item.label}
          </DropdownItem>
        </React.Fragment>
      ))}
    </Dropdown>
  );
}
