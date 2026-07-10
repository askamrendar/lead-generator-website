import * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { PageContainer } from '@/components/dashboard/PageContainer';

/**
 * Consistent "module coming soon" page. Every not-yet-built sidebar destination
 * renders one of these so the shell is fully navigable and each future module has a
 * real mount point. The feature milestone is shown as a hint.
 */
export function PlaceholderPage({
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
    <PageContainer>
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={icon}
        title={`${title} is coming soon`}
        description={
          phase
            ? `This module is planned for Phase ${phase}. The navigation and layout are ready for it.`
            : 'This module is not built yet. The navigation and layout are ready for it.'
        }
      />
    </PageContainer>
  );
}
