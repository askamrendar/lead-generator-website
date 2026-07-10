import { FileText } from 'lucide-react';
import { WebsitePlaceholder } from '@/components/websites/WebsitePlaceholder';

export default function WebsitePagesPage() {
  return (
    <WebsitePlaceholder
      title="Pages"
      description="Browse and manage the generated pages of this website."
      icon={FileText}
      phase="7.2.5"
    />
  );
}
