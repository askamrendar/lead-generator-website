import Link from 'next/link';
import { Bell } from 'lucide-react';

/**
 * Notifications bell — links to the Notification Center (Phase 8.5). Server component:
 * the full center (list, mark-read, levels) lives at /dashboard/notifications; this is
 * the header entry point into it.
 */
export function NotificationsButton() {
  return (
    <Link
      href="/dashboard/notifications"
      aria-label="Notifications"
      className="relative inline-flex size-9 items-center justify-center rounded-md text-muted-fg transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      <Bell className="size-4" aria-hidden />
      <span className="sr-only">Notifications</span>
    </Link>
  );
}
