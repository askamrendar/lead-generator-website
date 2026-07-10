import { Rocket } from 'lucide-react';
import { PlaceholderPage } from '@/components/dashboard/PlaceholderPage';

export default function DeploymentsPage() {
  return (
    <PlaceholderPage
      title="Deployments"
      description="Publish websites and track deployment status."
      icon={Rocket}
      phase="8"
    />
  );
}
