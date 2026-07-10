import { Bell } from 'lucide-react';
import { SettingsPlaceholder } from '@/components/dashboard/SettingsPlaceholder';

export default function NotificationsSettingsPage() {
  return (
    <SettingsPlaceholder
      title="Notifications"
      description="Choose which events email or alert you."
      icon={Bell}
      phase="9+"
    />
  );
}
