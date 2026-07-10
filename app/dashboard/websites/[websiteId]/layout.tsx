import * as React from 'react';
import { notFound } from 'next/navigation';
import { getWebsite } from '@/lib/websites/service';
import { isAccessError } from '@/lib/auth/access';
import { WebsiteDetailHeader } from '@/components/websites/WebsiteDetailHeader';
import { WebsiteDetailNav } from '@/components/websites/WebsiteDetailNav';

/**
 * Website-detail shell. Loads the website through the tenant-access layer (so an
 * unauthorized or non-existent id becomes a 404, never a leak), then renders the
 * header + tab nav around the active sub-page. Every website module mounts here.
 */
export default async function WebsiteDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = await params;

  let website;
  try {
    website = await getWebsite(websiteId);
  } catch (err) {
    if (isAccessError(err)) notFound();
    throw err;
  }

  return (
    <div className="space-y-6">
      <WebsiteDetailHeader website={website} />
      <WebsiteDetailNav websiteId={websiteId} />
      <div>{children}</div>
    </div>
  );
}
