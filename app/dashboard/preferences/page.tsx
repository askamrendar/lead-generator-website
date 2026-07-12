import type { Metadata } from 'next';
import { SlidersHorizontal } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/session';
import { getPreferences } from '@/lib/preferences/service';
import { PageHeader } from '@/components/ui/page-header';
import { PageContainer } from '@/components/dashboard/PageContainer';
import { EmptyState } from '@/components/ui/empty-state';
import { PreferencesPanel } from '@/components/productivity/PreferencesPanel';

export const metadata: Metadata = { title: 'Preferences' };

export default async function PreferencesPage() {
  const user = await getCurrentUser();
  if (!user) {
    return <EmptyState icon={SlidersHorizontal} title="Sign in required" description="Sign in to manage preferences." />;
  }
  const preferences = await getPreferences();

  return (
    <PageContainer>
      <PageHeader title="Preferences" description="Personalize your workspace — theme and keyboard shortcuts." />
      <PreferencesPanel preferences={preferences} />
    </PageContainer>
  );
}
