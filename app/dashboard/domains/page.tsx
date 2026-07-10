import { Link2 } from 'lucide-react';
import { PlaceholderPage } from '@/components/dashboard/PlaceholderPage';

export default function DomainsPage() {
  return (
    <PlaceholderPage
      title="Domains"
      description="Connect custom domains and manage DNS and SSL."
      icon={Link2}
      phase="8.5"
    />
  );
}
