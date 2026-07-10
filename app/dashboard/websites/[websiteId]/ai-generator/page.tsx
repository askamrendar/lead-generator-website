import { Sparkles } from 'lucide-react';
import { WebsitePlaceholder } from '@/components/websites/WebsitePlaceholder';

export default function WebsiteAiGeneratorPage() {
  return (
    <WebsitePlaceholder
      title="AI Generator"
      description="Generate homepage, services, location pages, metadata, and schema from this website's configuration."
      icon={Sparkles}
      phase="7.2.4"
    />
  );
}
