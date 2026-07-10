import { getWebsite } from '@/lib/websites/service';
import { WebsiteSettings } from '@/components/websites/WebsiteSettings';

export default async function WebsiteSettingsPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = await params;
  const website = await getWebsite(websiteId);
  return <WebsiteSettings website={website} />;
}
