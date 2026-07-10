import * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

/**
 * Placeholder body for a website-detail tab whose module isn't built yet. Rendered
 * inside the website detail layout (which already shows the header + tabs).
 */
export function WebsitePlaceholder({
  title,
  description,
  icon,
  phase,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  phase?: string;
}) {
  return (
    <EmptyState
      icon={icon}
      title={`${title} is coming soon`}
      description={
        description ??
        (phase
          ? `This module is planned for Phase ${phase}. It will attach to this website.`
          : 'This module will attach to this website in a later milestone.')
      }
    />
  );
}
