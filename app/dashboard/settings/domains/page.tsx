import { Link2 } from 'lucide-react';
import { SettingsPlaceholder } from '@/components/dashboard/SettingsPlaceholder';

export default function DomainsSettingsPage() {
  return (
    <SettingsPlaceholder
      title="Domains"
      description="Organization-level domain configuration and defaults."
      icon={Link2}
      phase="8.5"
    />
  );
}
