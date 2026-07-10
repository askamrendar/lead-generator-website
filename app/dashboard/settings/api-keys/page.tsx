import { KeyRound } from 'lucide-react';
import { SettingsPlaceholder } from '@/components/dashboard/SettingsPlaceholder';

export default function ApiKeysSettingsPage() {
  return (
    <SettingsPlaceholder
      title="API Keys"
      description="Create and revoke keys for programmatic access."
      icon={KeyRound}
      phase="later"
    />
  );
}
