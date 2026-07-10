import * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Panel } from '@/components/ui/panel';
import { EmptyState } from '@/components/ui/empty-state';

/** Structured shell for a settings section whose feature isn't built yet. */
export function SettingsPlaceholder({
  title,
  description,
  icon,
  phase,
  emptyTitle,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  phase?: string;
  emptyTitle?: string;
}) {
  return (
    <Panel title={title} description={description}>
      <EmptyState
        icon={icon}
        title={emptyTitle ?? `${title} coming soon`}
        description={phase ? `Planned for Phase ${phase}. This section is ready to wire up.` : undefined}
        className="border-0 py-8"
      />
    </Panel>
  );
}
