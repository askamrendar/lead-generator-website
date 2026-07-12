'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Overlay primitives — Modal (centered) and Drawer (side sheet) share one dialog
 * base: backdrop + Escape to close, body scroll lock, `role="dialog"`/`aria-modal`,
 * initial focus into the panel, a Tab focus trap, and focus restoration to the
 * previously-focused element on close. Dependency-free.
 */

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function useDialogBehavior(open: boolean, onClose: () => void, panelRef: React.RefObject<HTMLDivElement | null>) {
  React.useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      // Trap Tab within the panel so focus can't escape behind the backdrop.
      const panel = panelRef.current;
      if (!panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      if (items.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
      // Restore focus to whatever was focused before the dialog opened.
      previouslyFocused?.focus?.();
    };
  }, [open, onClose, panelRef]);
}

interface BaseProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}

export function Modal({ open, onClose, title, description, children, footer }: BaseProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  useDialogBehavior(open, onClose, panelRef);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 w-full max-w-lg rounded-lg border border-border bg-background shadow-xl outline-none animate-fade-up"
      >
        <DialogHeader title={title} description={description} onClose={onClose} />
        {children ? <div className="px-6 py-4">{children}</div> : null}
        {footer ? (
          <div className="flex justify-end gap-2 border-t border-border px-6 py-4">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}

export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  side = 'right',
}: BaseProps & { side?: 'left' | 'right' }) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  useDialogBehavior(open, onClose, panelRef);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90]">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'absolute inset-y-0 z-10 flex w-full max-w-sm flex-col border-border bg-background shadow-xl outline-none',
          side === 'right' ? 'right-0 border-l' : 'left-0 border-r',
        )}
      >
        <DialogHeader title={title} description={description} onClose={onClose} />
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
        {footer ? (
          <div className="flex justify-end gap-2 border-t border-border px-6 py-4">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}

function DialogHeader({
  title,
  description,
  onClose,
}: {
  title?: string;
  description?: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
      <div className="min-w-0">
        {title ? <h2 className="text-base font-semibold text-foreground">{title}</h2> : null}
        {description ? <p className="mt-0.5 text-sm text-muted-fg">{description}</p> : null}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="-mr-1 shrink-0 rounded-md p-1 text-muted-fg transition-colors hover:bg-muted hover:text-foreground"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}
