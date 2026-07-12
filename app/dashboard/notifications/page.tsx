import type { Metadata } from 'next';
import { Bell } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/session';
import { listNotifications } from '@/lib/jobs/notifications';
import { PageHeader } from '@/components/ui/page-header';
import { PageContainer } from '@/components/dashboard/PageContainer';
import { EmptyState } from '@/components/ui/empty-state';
import { NotificationCenter } from '@/components/jobs/NotificationCenter';

export const metadata: Metadata = { title: 'Notifications' };

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) {
    return <EmptyState icon={Bell} title="Sign in required" description="Sign in to view your notifications." />;
  }
  const { items, unread } = await listNotifications(user.id);
  const rows = items.map((n) => ({
    id: n.id,
    level: n.level,
    title: n.title,
    body: n.body,
    read: n.read,
    createdAt: n.createdAt,
  }));

  return (
    <PageContainer>
      <PageHeader title="Notifications" description="Success, error, warning, and maintenance alerts." />
      <NotificationCenter items={rows} unread={unread} />
    </PageContainer>
  );
}
