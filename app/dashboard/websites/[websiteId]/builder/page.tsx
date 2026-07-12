import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getWebsite } from '@/lib/websites/service';
import { getBuilderDocument } from '@/lib/websites/builder-service';
import { buildPreviewContext } from '@/lib/builder/editor/preview-context';
import { isAccessError } from '@/lib/auth/access';
import { ToastProvider } from '@/components/ui/toast';
import { BuilderEditor } from '@/components/builder/editor/BuilderEditor';

export const metadata: Metadata = {
  title: 'Visual Builder',
  robots: { index: false, follow: false },
};

/**
 * Visual Builder route. Full-screen editor (its own chrome via ToastProvider; the
 * dashboard shell's marketing chrome is already suppressed on /dashboard by SiteChrome).
 * Loads the website + its builder document through the tenant-access layer; a preview
 * BlockContext is built from the sample business until per-website generation exists.
 * The editor edits `builderConfig` only — rendering is delegated to BlockRenderer.
 */
export default async function BuilderPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = await params;

  let website;
  let document;
  try {
    website = await getWebsite(websiteId);
    document = await getBuilderDocument(websiteId);
  } catch (err) {
    if (isAccessError(err)) notFound();
    throw err;
  }

  const previewCtx = await buildPreviewContext(document.themeId);

  return (
    <ToastProvider>
      <BuilderEditor
        websiteId={websiteId}
        websiteName={website.name}
        initialDocument={document}
        previewCtx={previewCtx}
      />
    </ToastProvider>
  );
}
