'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * Headless dropdown/menu primitive — dependency-free. Handles click-outside,
 * Escape-to-close, and menu ARIA roles. Composed by ActionMenu, UserMenu, and the
 * org/workspace switchers. Content closes on item activation.
 */
export function Dropdown({
  trigger,
  children,
  align = 'end',
  triggerClassName,
  menuClassName,
  label,
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'start' | 'end';
  triggerClassName?: string;
  menuClassName?: string;
  label?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={triggerClassName}
      >
        {trigger}
      </button>
      {open ? (
        <div
          role="menu"
          aria-label={label}
          onClick={() => setOpen(false)}
          className={cn(
            'absolute z-50 mt-2 min-w-[12rem] overflow-hidden rounded-md border border-border bg-background p-1 shadow-lg animate-fade-up',
            align === 'end' ? 'right-0' : 'left-0',
            menuClassName,
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

const itemClass =
  'flex w-full items-center gap-2 rounded-sm px-2.5 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none [&_svg]:size-4 [&_svg]:shrink-0';

/** A menu item — renders a Link when `href` is set, else a button. */
export function DropdownItem({
  children,
  href,
  onSelect,
  disabled,
  destructive,
}: {
  children: React.ReactNode;
  href?: string;
  onSelect?: () => void;
  disabled?: boolean;
  destructive?: boolean;
}) {
  const cls = cn(itemClass, destructive && 'text-red-600 dark:text-red-400 hover:bg-red-500/10');
  if (href) {
    return (
      <Link role="menuitem" href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onSelect}
      className={cn(cls, 'disabled:pointer-events-none disabled:opacity-50')}
    >
      {children}
    </button>
  );
}

export function DropdownLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-2.5 py-1.5 text-xs font-medium text-muted-fg">{children}</p>
  );
}

export function DropdownSeparator() {
  return <div className="my-1 h-px bg-border" role="separator" />;
}
