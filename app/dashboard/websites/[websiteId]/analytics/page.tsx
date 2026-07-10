import { BarChart3 } from 'lucide-react';
import { WebsitePlaceholder } from '@/components/websites/WebsitePlaceholder';

export default function WebsiteAnalyticsPage() {
  return (
    <WebsitePlaceholder
      title="Analytics"
      description="Traffic and conversion insight for this website."
      icon={BarChart3}
      phase="9+"
    />
  );
}
