import { History } from 'lucide-react';
import { WebsitePlaceholder } from '@/components/websites/WebsitePlaceholder';

export default function WebsiteVersionsPage() {
  return (
    <WebsitePlaceholder
      title="Versions"
      description="Version history for this website — restore, compare, and roll back."
      icon={History}
      phase="9.5"
    />
  );
}
