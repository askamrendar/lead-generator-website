import { redirect } from 'next/navigation';

/**
 * The Builder tab now opens the full-page Site Editor (`/editor/<id>`), which
 * edits the content the served site ACTUALLY renders (per-page overrides merged
 * by the HTML-pack engine, applied to live/hosted/export). The old block-based
 * Visual Builder edited a home-page draft the HTML serving path never read —
 * this redirect keeps every existing link and the tab working while removing
 * that dead end. The block editor stack stays in the tree for a future
 * template-pack visual mode.
 */
export default async function BuilderPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = await params;
  redirect(`/editor/${websiteId}`);
}
