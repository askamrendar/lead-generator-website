import * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Panel } from '@/components/ui/panel';
import { EmptyState } from '@/components/ui/empty-state';

/**
 * A home panel for a system that doesn't exist yet (Deployments, Domains, AI usage,
 * activity, …). Shows the real section layout with an HONEST empty/"coming" state —
 * never fabricated data. Wire real content in when the backing system lands.
 */
export function SoonPanel({
  title,
  icon,
  emptyTitle,
  description,
  phase,
}: {
  title: string;
  icon?: LucideIcon;
  emptyTitle: string;
  description?: string;
  phase?: string;
}) {
  return (
    <Panel title={title}>
      <EmptyState
        icon={icon}
        title={emptyTitle}
        description={
          description ?? (phase ? `Arrives in Phase ${phase}.` : undefined)
        }
        className="border-0 py-6"
      />
    </Panel>
  );
}
