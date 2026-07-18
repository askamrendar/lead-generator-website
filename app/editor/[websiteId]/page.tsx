import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getEditorData } from '@/lib/websites/editor-service';
import { isAccessError } from '@/lib/auth/access';
import { ToastProvider } from '@/components/ui/toast';
import { SiteContentEditor } from '@/components/editor/SiteContentEditor';

export const metadata: Metadata = {
  title: 'Site Editor',
  robots: { index: false, follow: false },
};

/**
 * Full-page Site Editor (`/editor/<websiteId>`) — outside the dashboard shell
 * (SiteChrome bares this route; auth-guarded in middleware) so the editor owns
 * the whole viewport: page-list sidebar + per-page content form, like a CMS.
 * Edits save as `contentOverrides` patches that the render engine merges over
 * generated content — live site, hosted domains, and ZIP export all pick them
 * up on the next render.
 */
export default async function SiteEditorPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = await params;

  let data;
  try {
    data = await getEditorData(websiteId);
  } catch (err) {
    if (isAccessError(err)) notFound();
    throw err;
  }
  if (!data) notFound();

  return (
    <ToastProvider>
      <SiteContentEditor data={data} />
    </ToastProvider>
  );
}
