import Link from 'next/link';
import { Panel } from '@/components/ui/panel';
import { Button } from '@/components/ui/button';
import { InfoList } from '@/components/dashboard/InfoList';

export default function NotificationsSettingsPage() {
  return (
    <Panel title="Notifications" description="In-app notifications for generation, deployment, and job events.">
      <InfoList
        items={[
          ['Notification center', 'Bell icon in the top bar, or Insights → Notifications'],
          ['Events', 'Generation finished, deployment succeeded/failed, background job results'],
          ['Email notifications', 'Available once an email provider is connected'],
        ]}
      />
      <div className="mt-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/notifications">Open notification center</Link>
        </Button>
      </div>
    </Panel>
  );
}
