import { Paintbrush } from 'lucide-react';
import { WebsitePlaceholder } from '@/components/websites/WebsitePlaceholder';

export default function WebsiteBuilderPage() {
  return (
    <WebsitePlaceholder
      title="Visual Builder"
      description="Edit this website's blocks, theme, and content visually. The builder edits; the manager manages."
      icon={Paintbrush}
      phase="7.2.5"
    />
  );
}
