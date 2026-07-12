'use client';

import * as React from 'react';
import { Trash2, RotateCcw, Archive, ArchiveRestore } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  restoreFromTrashAction,
  purgeWebsiteAction,
  restoreArchivedAction,
} from '@/app/dashboard/productivity/actions';
import type { WebsiteSummary } from '@/lib/websites/types';

/** Trash + Archive management. Restore or permanently delete; restore archived sites. */
export function TrashList({ trashed, archived }: { trashed: WebsiteSummary[]; archived: WebsiteSummary[] }) {
  const [pending, startTransition] = React.useTransition();
  const [purgeTarget, setPurgeTarget] = React.useState<WebsiteSummary | null>(null);

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Trash</h2>
        {trashed.length === 0 ? (
          <EmptyState icon={Trash2} title="Trash is empty" description="Deleted websites can be restored from here." />
        ) : (
          <Card className="divide-y divide-border overflow-hidden">
            {trashed.map((w) => (
              <div key={w.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{w.name}</p>
                  <p className="truncate text-xs text-muted-fg">/{w.slug}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => startTransition(() => restoreFromTrashAction(w.id).then(() => undefined))}
                  >
                    <RotateCcw aria-hidden /> Restore
                  </Button>
                  <Button size="sm" variant="ghost" disabled={pending} onClick={() => setPurgeTarget(w)}>
                    <Trash2 aria-hidden /> Delete forever
                  </Button>
                </div>
              </div>
            ))}
          </Card>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Archived</h2>
        {archived.length === 0 ? (
          <EmptyState icon={Archive} title="No archived websites" description="Archived websites are hidden from your main list." />
        ) : (
          <Card className="divide-y divide-border overflow-hidden">
            {archived.map((w) => (
              <div key={w.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{w.name}</p>
                  <p className="truncate text-xs text-muted-fg">/{w.slug}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() => startTransition(() => restoreArchivedAction(w.id).then(() => undefined))}
                >
                  <ArchiveRestore aria-hidden /> Unarchive
                </Button>
              </div>
            ))}
          </Card>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(purgeTarget)}
        title="Delete forever?"
        description={purgeTarget ? `"${purgeTarget.name}" and all its data will be permanently deleted. This cannot be undone.` : ''}
        confirmLabel="Delete forever"
        destructive
        onClose={() => setPurgeTarget(null)}
        onConfirm={async () => {
          const id = purgeTarget?.id;
          if (id) await purgeWebsiteAction(id);
        }}
      />
    </div>
  );
}
