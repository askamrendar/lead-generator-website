'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Film,
  Folder,
  FolderPlus,
  ImageIcon,
  Trash2,
  Upload,
  Wand2,
  X,
} from 'lucide-react';
import { Panel } from '@/components/ui/panel';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchInput } from '@/components/ui/search-input';
import { EmptyState } from '@/components/ui/empty-state';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { formatBytes, matchesQuery } from '@/lib/media/kind';
import { EDITOR_OPS } from '@/lib/media/editor';
import type { MediaAssetDTO, FolderDTO } from '@/lib/media/service';
import type { StorageHealth } from '@/lib/media/storage/types';
import {
  updateAssetAction,
  deleteAssetAction,
  createFolderAction,
  deleteFolderAction,
} from '@/app/dashboard/media/actions';

const KIND_ICON = { IMAGE: ImageIcon, LOGO: ImageIcon, ICON: ImageIcon, VIDEO: Film, DOCUMENT: FileText, OTHER: FileText } as const;

export function MediaLibrary({
  workspaceId,
  assets,
  folders,
  health,
}: {
  workspaceId: string;
  assets: MediaAssetDTO[];
  folders: FolderDTO[];
  health: StorageHealth[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = React.useTransition();
  const [query, setQuery] = React.useState('');
  const [folder, setFolder] = React.useState<string | 'all'>('all');
  const [selected, setSelected] = React.useState<MediaAssetDTO | null>(null);
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [dragOver, setDragOver] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const visible = assets.filter(
    (a) => (folder === 'all' || a.folderId === folder) && matchesQuery(a, query),
  );

  async function upload(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('workspaceId', workspaceId);
    if (folder !== 'all') fd.append('folderId', folder);
    for (const f of list) fd.append('file', f);
    try {
      const res = await fetch('/api/media/upload', { method: 'POST', body: fd });
      if (res.ok) { toast({ variant: 'success', title: `Uploaded ${list.length} file(s)` }); router.refresh(); }
      else { const j = await res.json().catch(() => ({})); toast({ variant: 'error', title: 'Upload failed', description: j.error }); }
    } catch {
      toast({ variant: 'error', title: 'Upload failed', description: 'Network error.' });
    } finally {
      setUploading(false);
    }
  }

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    startTransition(async () => {
      const r = await fn();
      if (r.ok) { toast({ variant: 'success', title: success }); router.refresh(); }
      else toast({ variant: 'error', title: 'Action failed', description: r.error });
    });
  }

  return (
    <div className="space-y-6">
      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); void upload(e.dataTransfer.files); }}
        className={cn('rounded-lg border-2 border-dashed p-8 text-center transition-colors', dragOver ? 'border-brand bg-brand/5' : 'border-border')}
      >
        <Upload className="mx-auto size-6 text-muted-fg" aria-hidden />
        <p className="mt-2 text-sm text-foreground">Drag &amp; drop files here, or</p>
        <div className="mt-3">
          <input ref={inputRef} type="file" multiple hidden onChange={(e) => e.target.files && upload(e.target.files)} />
          <Button size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
            {uploading ? 'Uploading…' : 'Choose files'}
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-fg">Images, video, PDF · up to 20 MB each</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
        {/* Folders */}
        <aside className="space-y-1">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold uppercase text-muted-fg">Folders</span>
            <button type="button" aria-label="New folder" onClick={() => { const name = prompt('Folder name'); if (name) run(() => createFolderAction(workspaceId, name), 'Folder created'); }} className="text-muted-fg hover:text-foreground"><FolderPlus className="size-4" aria-hidden /></button>
          </div>
          <button type="button" onClick={() => setFolder('all')} className={cn('flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm', folder === 'all' ? 'bg-muted text-foreground' : 'text-muted-fg hover:bg-muted')}>
            <Folder className="size-4" aria-hidden /> All assets <span className="ml-auto text-xs">{assets.length}</span>
          </button>
          {folders.map((f) => (
            <div key={f.id} className={cn('group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm', folder === f.id ? 'bg-muted text-foreground' : 'text-muted-fg hover:bg-muted')}>
              <button type="button" onClick={() => setFolder(f.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left"><Folder className="size-4 shrink-0" aria-hidden /><span className="truncate">{f.name}</span><span className="ml-auto text-xs">{f.count}</span></button>
              <button type="button" aria-label="Delete folder" onClick={() => run(() => deleteFolderAction(f.id), 'Folder deleted')} className="opacity-0 group-hover:opacity-100"><X className="size-3.5" aria-hidden /></button>
            </div>
          ))}
        </aside>

        {/* Grid */}
        <div className="min-w-0 space-y-4">
          <SearchInput value={query} onChange={setQuery} placeholder="Search media…" className="max-w-xs" />
          {visible.length === 0 ? (
            <EmptyState icon={ImageIcon} title="No media yet" description="Upload assets to reuse them across your websites." />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {visible.map((a) => {
                const Icon = KIND_ICON[a.kind as keyof typeof KIND_ICON] ?? FileText;
                return (
                  <button key={a.id} type="button" onClick={() => setSelected(a)} className={cn('group overflow-hidden rounded-lg border text-left transition-colors', selected?.id === a.id ? 'border-brand' : 'border-border hover:border-brand/40')}>
                    <div className="flex aspect-square items-center justify-center bg-muted">
                      {a.kind === 'IMAGE' || a.kind === 'LOGO' || a.kind === 'ICON' ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.url} alt={a.altText ?? a.filename} className="size-full object-cover" />
                      ) : (
                        <Icon className="size-8 text-muted-fg" aria-hidden />
                      )}
                    </div>
                    <div className="p-2">
                      <p className="truncate text-xs font-medium text-foreground">{a.filename}</p>
                      <p className="text-[10px] text-muted-fg">{formatBytes(a.sizeBytes)}{a.usageCount > 0 ? ` · used ${a.usageCount}×` : ''}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Storage providers */}
      <Panel title="Storage" description="Provider abstraction & health">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {health.map((h) => (
            <Card key={h.id} className="flex items-center justify-between p-3">
              <div className="min-w-0"><p className="truncate text-sm font-medium text-foreground">{h.name}</p><p className="truncate text-xs text-muted-fg">{h.message}</p></div>
              <span className={cn('ml-2 size-2.5 shrink-0 rounded-full', h.configured ? 'bg-green-500' : 'bg-muted-fg/40')} aria-hidden />
            </Card>
          ))}
        </div>
      </Panel>

      {/* Asset detail */}
      <Modal open={selected !== null} onClose={() => setSelected(null)} title={selected?.filename} description={selected ? `${selected.mimeType} · ${formatBytes(selected.sizeBytes)}` : undefined}>
        {selected ? <AssetDetail key={selected.id} asset={selected} folders={folders} pending={pending} onSave={(patch) => run(() => updateAssetAction(selected.id, patch), 'Saved')} onDelete={() => { run(() => deleteAssetAction(selected.id), 'Deleted'); setSelected(null); }} onEdit={() => setEditorOpen(true)} /> : null}
      </Modal>

      {/* Image editor (operations recorded; processing awaiting infra) */}
      <Modal open={editorOpen} onClose={() => setEditorOpen(false)} title="Image editor">
        <div className="space-y-3">
          <p className="text-sm text-muted-fg">Operations below are wired to the editor contract. Pixel processing runs on an image pipeline that&apos;s <span className="font-medium text-foreground">awaiting infrastructure</span> (sharp / cloud transform).</p>
          <div className="grid grid-cols-2 gap-2">
            {EDITOR_OPS.map((op) => (
              <Button key={op.id} type="button" variant="outline" size="sm" disabled title="Awaiting image-processing infra"><Wand2 aria-hidden /> {op.label}</Button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}

function AssetDetail({
  asset, folders, pending, onSave, onDelete, onEdit,
}: {
  asset: MediaAssetDTO;
  folders: FolderDTO[];
  pending: boolean;
  onSave: (patch: { altText?: string; tags?: string[]; folderId?: string | null }) => void;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const [alt, setAlt] = React.useState(asset.altText ?? '');
  const [tags, setTags] = React.useState(asset.tags.join(', '));
  const [folderId, setFolderId] = React.useState(asset.folderId ?? '');
  const isImage = asset.kind === 'IMAGE' || asset.kind === 'LOGO' || asset.kind === 'ICON';

  return (
    <div className="space-y-4">
      {isImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={asset.url} alt={asset.altText ?? asset.filename} className="max-h-56 w-full rounded-md border border-border object-contain" />
      ) : null}
      <div className="space-y-1"><label className="text-xs font-medium text-foreground">Alt text</label><Input value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Describe the image" /></div>
      <div className="space-y-1"><label className="text-xs font-medium text-foreground">Tags (comma separated)</label><Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="brand, hero" /></div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-foreground">Folder</label>
        <select value={folderId} onChange={(e) => setFolderId(e.target.value)} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
          <option value="">No folder</option>
          {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      </div>
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex gap-2">
          <Button size="sm" disabled={pending} onClick={() => onSave({ altText: alt, tags: tags.split(',').map((t) => t.trim()).filter(Boolean), folderId: folderId || null })}>Save</Button>
          {isImage ? <Button size="sm" variant="outline" onClick={onEdit}><Wand2 aria-hidden /> Edit</Button> : null}
        </div>
        <Button size="sm" variant="outline" className="text-red-600" disabled={pending} onClick={onDelete}><Trash2 aria-hidden /> Delete</Button>
      </div>
    </div>
  );
}
