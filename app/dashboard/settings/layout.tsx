import type { Metadata } from 'next';
import { PageContainer } from '@/components/dashboard/PageContainer';
import { PageHeader } from '@/components/ui/page-header';
import { SettingsNav } from '@/components/dashboard/SettingsNav';

export const metadata: Metadata = { title: 'Settings' };

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageContainer>
      <PageHeader title="Settings" description="Manage your account, organization, and workspace." />
      <div className="flex flex-col gap-6 lg:flex-row">
        <SettingsNav />
        <div className="min-w-0 flex-1 space-y-6">{children}</div>
      </div>
    </PageContainer>
  );
}
