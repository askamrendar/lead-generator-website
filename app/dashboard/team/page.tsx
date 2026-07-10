import { Users } from 'lucide-react';
import { PlaceholderPage } from '@/components/dashboard/PlaceholderPage';

export default function TeamPage() {
  return (
    <PlaceholderPage
      title="Team"
      description="Invite members and manage roles."
      icon={Users}
      phase="9"
    />
  );
}
