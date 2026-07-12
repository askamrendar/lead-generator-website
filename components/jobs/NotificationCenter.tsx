'use client';

import { useTransition } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, Check, CheckCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { markNotificationReadAction, markAllNotificationsReadAction } from '@/app/dashboard/jobs/actions';

interface NotificationRow {
  id: string;
  level: string;
  title: string;
  body: string | null;
  read: boolean;
  createdAt: string | Date;
}

const LEVEL_ICON: Record<string, { icon: typeof Info; className: string }> = {
  SUCCESS: { icon: CheckCircle2, className: 'text-emerald-600' },
  ERROR: { icon: AlertCircle, className: 'text-red-600 dark:text-red-400' },
  WARNING: { icon: AlertTriangle, className: 'text-amber-600' },
  INFO: { icon: Info, className: 'text-brand' },
};

export function NotificationCenter({ items, unread }: { items: NotificationRow[]; unread: number }) {
  const [pending, startTransition] = useTransition();

  if (items.length === 0) {
    return <EmptyState icon={Info} title="No notifications" description="Success, error, warning, and maintenance alerts will appear here." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-fg">{unread} unread</p>
        {unread > 0 && (
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => startTransition(() => markAllNotificationsReadAction().then(() => undefined))}
          >
            <CheckCheck className="size-3.5" aria-hidden /> Mark all read
          </Button>
        )}
      </div>
      <Card className="divide-y divide-border overflow-hidden">
        {items.map((n) => {
          const meta = LEVEL_ICON[n.level] ?? LEVEL_ICON.INFO;
          const Icon = meta.icon;
          return (
            <div key={n.id} className={`flex items-start gap-3 px-5 py-4 ${n.read ? '' : 'bg-muted/40'}`}>
              <Icon className={`mt-0.5 size-5 shrink-0 ${meta.className}`} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{n.title}</p>
                {n.body && <p className="mt-0.5 text-sm text-muted-fg">{n.body}</p>}
              </div>
              {!n.read && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={pending}
                  onClick={() => startTransition(() => markNotificationReadAction(n.id).then(() => undefined))}
                  aria-label="Mark read"
                >
                  <Check className="size-3.5" aria-hidden />
                </Button>
              )}
            </div>
          );
        })}
      </Card>
    </div>
  );
}
