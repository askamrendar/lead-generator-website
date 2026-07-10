import { KeyRound } from 'lucide-react';
import { PlaceholderPage } from '@/components/dashboard/PlaceholderPage';

export default function ApiKeysPage() {
  return (
    <PlaceholderPage
      title="API Keys"
      description="Create and revoke API keys for programmatic access."
      icon={KeyRound}
      phase="later"
    />
  );
}
