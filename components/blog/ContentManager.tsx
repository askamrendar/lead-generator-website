'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Archive, Copy, FileText, Pencil, Rocket, Sparkles, Trash2 } from 'lucide-react';
import { Panel } from '@/components/ui/panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable, type Column } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { CONTENT_TYPES, contentTypeLabel, type ContentType } from '@/lib/blog/content-types';
import type { ContentDTO } from '@/lib/blog/service';
import {
  generateOneAction,
  generateBulkAction,
  updateContentAction,
  setStatusAction,
  duplicateContentAction,
  deleteContentAction,
} from '@/app/dashboard/websites/[websiteId]/pages/actions';

const STATUS_TONE: Record<string, string> = {
  PUBLISHED: 'bg-green-500/15 text-green-700 dark:text-green-400',
  DRAFT: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  SCHEDULED: 'bg-brand/15 text-brand',
  ARCHIVED: 'bg-muted text-muted-fg',
};

export function ContentManager({ websiteId, items }: { websiteId: string; items: ContentDTO[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = React.useTransition();
  const [type, setType] = React.useState<ContentType>('ARTICLE');
  const [topic, setTopic] = React.useState('');
  const [editing, setEditing] = React.useState<ContentDTO | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    startTransition(async () => {
      const r = await fn();
      if (r.ok) { toast({ variant: 'success', title: success }); router.refresh(); }
      else toast({ variant: 'error', title: 'Action failed', description: r.error });
    });
  }

  const columns: Column<ContentDTO>[] = [
    {
      key: 'title', header: 'Title',
      render: (c) => (
        <button type="button" onClick={() => setEditing(c)} className="text-left">
          <span className="font-medium text-foreground hover:underline">{c.title}</span>
          <span className="block text-xs text-muted-fg">{contentTypeLabel(c.type)} · {c.wordCount} words · {c.readingTimeMin} min</span>
        </button>
      ),
    },
    { key: 'status', header: 'Status', render: (c) => <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_TONE[c.status] ?? 'bg-muted text-muted-fg')}>{c.status.toLowerCase()}</span> },
    { key: 'updated', header: 'Updated', render: (c) => <span className="text-muted-fg">{new Date(c.updatedAt).toLocaleDateString()}</span> },
    {
      key: 'actions', header: <span className="sr-only">Actions</span>, align: 'right',
      render: (c) => (
        <div className="flex items-center justify-end gap-1">
          <button type="button" aria-label="Edit" onClick={() => setEditing(c)} className="rounded p-1.5 text-muted-fg hover:bg-muted hover:text-foreground"><Pencil className="size-4" aria-hidden /></button>
          {c.status !== 'PUBLISHED' ? (
            <button type="button" aria-label="Publish" disabled={pending} onClick={() => run(() => setStatusAction(websiteId, c.id, 'PUBLISHED'), 'Published')} className="rounded p-1.5 text-muted-fg hover:bg-muted hover:text-foreground"><Rocket className="size-4" aria-hidden /></button>
          ) : (
            <button type="button" aria-label="Archive" disabled={pending} onClick={() => run(() => setStatusAction(websiteId, c.id, 'ARCHIVED'), 'Archived')} className="rounded p-1.5 text-muted-fg hover:bg-muted hover:text-foreground"><Archive className="size-4" aria-hidden /></button>
          )}
          <button type="button" aria-label="Duplicate" disabled={pending} onClick={() => run(() => duplicateContentAction(websiteId, c.id), 'Duplicated')} className="rounded p-1.5 text-muted-fg hover:bg-muted hover:text-foreground"><Copy className="size-4" aria-hidden /></button>
          <button type="button" aria-label="Delete" onClick={() => setDeleteId(c.id)} className="rounded p-1.5 text-muted-fg hover:bg-red-500/10 hover:text-red-600"><Trash2 className="size-4" aria-hidden /></button>
        </div>
      ),
    },
  ];

  const coreTypes: ContentType[] = ['SERVICE', 'CITY', 'FAQ', 'EDUCATIONAL', 'ARTICLE'];

  return (
    <div className="space-y-6">
      <Panel title="Generate content" description="AI-assisted, SEO-ready content from your business config">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-muted-fg">Type</span>
            <select value={type} onChange={(e) => setType(e.target.value as ContentType)} className="h-10 rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
              {CONTENT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </label>
          <label className="min-w-0 flex-1 text-sm">
            <span className="mb-1 block text-xs font-medium text-muted-fg">Topic (optional)</span>
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Winter maintenance tips" />
          </label>
          <Button disabled={pending} onClick={() => run(() => generateOneAction(websiteId, type, topic), 'Content generated')}>
            <Sparkles aria-hidden /> Generate
          </Button>
          <Button variant="outline" disabled={pending} onClick={() => run(() => generateBulkAction(websiteId, coreTypes), 'Bulk generated')}>
            Generate core set
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-fg">Deterministic baseline today; a configured AI provider (lib/ai) upgrades the copy automatically.</p>
      </Panel>

      <Panel title="Content" bodyClassName="p-0">
        {items.length === 0 ? (
          <div className="p-5"><EmptyState icon={FileText} title="No content yet" description="Generate your first page or article above." className="border-0" /></div>
        ) : (
          <DataTable columns={columns} rows={items} getRowKey={(c) => c.id} empty="No content." />
        )}
      </Panel>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing ? `Edit: ${editing.title}` : ''}>
        {editing ? <ContentEditor key={editing.id} item={editing} pending={pending} onSave={(patch) => { run(() => updateContentAction(websiteId, editing.id, patch), 'Saved'); }} /> : null}
      </Modal>

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => { if (deleteId) { const r = await deleteContentAction(websiteId, deleteId); if (r.ok) { toast({ variant: 'success', title: 'Deleted' }); router.refresh(); } else toast({ variant: 'error', title: 'Delete failed', description: r.error }); } }}
        title="Delete content?"
        description="This permanently removes the content item."
        confirmLabel="Delete"
        destructive
      />
    </div>
  );
}

function ContentEditor({
  item, pending, onSave,
}: {
  item: ContentDTO;
  pending: boolean;
  onSave: (patch: { title?: string; body?: string; excerpt?: string; tags?: string[]; featuredImageId?: string | null }) => void;
}) {
  const [title, setTitle] = React.useState(item.title);
  const [body, setBody] = React.useState(item.body);
  const [tags, setTags] = React.useState(item.tags.join(', '));
  const [featured, setFeatured] = React.useState(item.featuredImageId ?? '');
  const seo = item.seo as { title?: string; description?: string } | null;

  return (
    <div className="space-y-4">
      <div className="space-y-1"><label className="text-xs font-medium text-foreground">Title</label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-foreground">Body (Markdown)</label>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} className="min-h-56 w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1"><label className="text-xs font-medium text-foreground">Tags</label><Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="tag1, tag2" /></div>
        <div className="space-y-1"><label className="text-xs font-medium text-foreground">Featured image (media id)</label><Input value={featured} onChange={(e) => setFeatured(e.target.value)} placeholder="Media asset id" /></div>
      </div>
      {seo ? (
        <div className="rounded-md border border-border bg-muted/40 p-3 text-xs">
          <p className="font-medium text-foreground">SEO preview</p>
          <p className="mt-1 text-brand">{seo.title}</p>
          <p className="text-muted-fg">{seo.description}</p>
        </div>
      ) : null}
      <div className="flex justify-end">
        <Button size="sm" disabled={pending} onClick={() => onSave({ title, body, tags: tags.split(',').map((t) => t.trim()).filter(Boolean), featuredImageId: featured || null })}>Save</Button>
      </div>
    </div>
  );
}
