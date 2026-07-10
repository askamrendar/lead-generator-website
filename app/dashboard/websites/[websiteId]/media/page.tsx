import { Image } from 'lucide-react';
import { WebsitePlaceholder } from '@/components/websites/WebsitePlaceholder';

export default function WebsiteMediaPage() {
  return (
    <WebsitePlaceholder
      title="Media"
      description="This website's images, logos, and brand assets."
      icon={Image}
      phase="8.6"
    />
  );
}
