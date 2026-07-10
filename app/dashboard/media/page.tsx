import { Image } from 'lucide-react';
import { PlaceholderPage } from '@/components/dashboard/PlaceholderPage';

export default function MediaPage() {
  return (
    <PlaceholderPage
      title="Media Library"
      description="Upload and manage images, logos, and brand assets."
      icon={Image}
      phase="8.6"
    />
  );
}
