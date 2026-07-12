'use client';

import * as React from 'react';
import { History, RotateCcw, Camera } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { saveRevisionAction, restoreRevisionAction } from '@/app/dashboard/productivity/actions';
import type { RevisionSummary } from '@/lib/productivity/service';

/**
 * Version History — capture manual snapshots of a website's builder/business config
 * and restore any prior revision. Reuses the tenant-access-guarded productivity
 * service; snapshot ids/timestamps are generated client-side (Date/crypto allowed here).
 */
export function VersionHistory({ websiteId, revisions }: { websiteId: string; revisions: RevisionSummary[] }) {
  const [pending, startTransition] = React.useTransition();
  const [label, setLabel] = React.useState('');

  function snapshot() {
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `rev-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    const at = new Date().toISOString();
    startTransition(async () => {
      await saveRevisionAction(websiteId, label.trim() || 'Manual snapshot', id, at);
      setLabel('');
    });
  }

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-foreground">Create a snapshot</h2>
        <p className="mt-1 text-sm text-muted-fg">
          Save the current builder + business configuration so you can restore it later.
        </p>
        <div className="mt-3 flex gap-2">
          <Input
            placeholder="Snapshot label (optional)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            aria-label="Snapshot label"
          />
          <Button size="sm" disabled={pending} onClick={snapshot}>
            <Camera aria-hidden /> Snapshot
          </Button>
        </div>
      </Card>

      {revisions.length === 0 ? (
        <EmptyState icon={History} title="No versions yet" description="Create a snapshot to start a version history." />
      ) : (
        <Card className="divide-y divide-border overflow-hidden">
          {revisions.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{r.label}</p>
                <p className="text-xs text-muted-fg">{new Date(r.at).toLocaleString()}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => startTransition(() => restoreRevisionAction(websiteId, r.id).then(() => undefined))}
              >
                <RotateCcw aria-hidden /> Restore
              </Button>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
