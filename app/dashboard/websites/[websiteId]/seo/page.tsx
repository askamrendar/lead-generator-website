import { Search } from 'lucide-react';
import { WebsitePlaceholder } from '@/components/websites/WebsitePlaceholder';

export default function WebsiteSeoPage() {
  return (
    <WebsitePlaceholder
      title="SEO"
      description="Review metadata, structured data, and keyword coverage for this website."
      icon={Search}
      phase="7.2.5"
    />
  );
}
