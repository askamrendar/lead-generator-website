'use client';

import * as React from 'react';
import { ChevronDown, ChevronUp, Copy, GripVertical, Plus, Search, Trash2 } from 'lucide-react';
import { allBlockMeta, humanizeBlockType } from '@/lib/builder/editor/block-meta';
import type { BlockInstance } from '@/lib/builder/types';
import { cn } from '@/lib/utils';

/**
 * Left rail: the ordered block list (select / reorder via drag or ↑↓ / duplicate /
 * delete) plus a searchable block library to add new blocks. Drag-and-drop uses the
 * native HTML5 API (no new dependency) and reports the new id order.
 */
export function BlockListPanel({
  blocks,
  selectedId,
  onSelect,
  onReorder,
  onMove,
  onDuplicate,
  onDelete,
  onAdd,
}: {
  blocks: BlockInstance[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (orderedIds: string[]) => void;
  onMove: (id: string, delta: number) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (type: string) => void;
}) {
  const [libOpen, setLibOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const dragId = React.useRef<string | null>(null);

  function handleDrop(targetId: string) {
    const from = dragId.current;
    dragId.current = null;
    if (!from || from === targetId) return;
    const ids = blocks.map((b) => b.id!);
    const fromIdx = ids.indexOf(from);
    const toIdx = ids.indexOf(targetId);
    if (fromIdx < 0 || toIdx < 0) return;
    ids.splice(toIdx, 0, ids.splice(fromIdx, 1)[0]!);
    onReorder(ids);
  }

  const library = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return allBlockMeta().filter((m) => !q || m.label.toLowerCase().includes(q) || m.type.includes(q));
  }, [query]);

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-background">
      <div className="flex items-center justify-between px-3 py-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-fg">Blocks</h2>
        <button
          type="button"
          onClick={() => setLibOpen((o) => !o)}
          className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          <Plus className="size-3.5" aria-hidden /> Add
        </button>
      </div>

      {libOpen ? (
        <div className="border-y border-border bg-muted/30 p-2">
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-fg" aria-hidden />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search blocks…"
              aria-label="Search blocks"
              className="h-8 w-full rounded-md border border-border bg-background pl-7 pr-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand"
            />
          </div>
          <ul className="max-h-64 space-y-0.5 overflow-y-auto">
            {library.map((m) => (
              <li key={m.type}>
                <button
                  type="button"
                  onClick={() => { onAdd(m.type); setLibOpen(false); setQuery(''); }}
                  className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-muted"
                >
                  <span>{m.label}</span>
                  <span className="text-[10px] uppercase text-muted-fg">{m.category}</span>
                </button>
              </li>
            ))}
            {library.length === 0 ? <li className="px-2 py-2 text-xs text-muted-fg">No blocks match.</li> : null}
          </ul>
        </div>
      ) : null}

      <ul className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {blocks.map((b, i) => {
          const id = b.id!;
          const active = id === selectedId;
          return (
            <li
              key={id}
              draggable
              onDragStart={() => (dragId.current = id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(id)}
              className={cn(
                'group flex items-center gap-1 rounded-md border px-1.5 py-1.5 text-sm transition-colors',
                active ? 'border-brand bg-brand/5' : 'border-transparent hover:bg-muted',
              )}
            >
              <GripVertical className="size-4 shrink-0 cursor-grab text-muted-fg" aria-hidden />
              <button type="button" onClick={() => onSelect(id)} className="min-w-0 flex-1 truncate text-left text-foreground">
                {humanizeBlockType(b.type)}
              </button>
              <div className="flex items-center opacity-0 transition-opacity group-hover:opacity-100">
                <MiniBtn label="Move up" onClick={() => onMove(id, -1)} disabled={i === 0}><ChevronUp className="size-3.5" aria-hidden /></MiniBtn>
                <MiniBtn label="Move down" onClick={() => onMove(id, 1)} disabled={i === blocks.length - 1}><ChevronDown className="size-3.5" aria-hidden /></MiniBtn>
                <MiniBtn label="Duplicate" onClick={() => onDuplicate(id)}><Copy className="size-3.5" aria-hidden /></MiniBtn>
                <MiniBtn label="Delete" onClick={() => onDelete(id)} destructive><Trash2 className="size-3.5" aria-hidden /></MiniBtn>
              </div>
            </li>
          );
        })}
        {blocks.length === 0 ? <li className="px-2 py-6 text-center text-xs text-muted-fg">No blocks yet. Use “Add”.</li> : null}
      </ul>
    </aside>
  );
}

function MiniBtn({ label, onClick, disabled, destructive, children }: { label: string; onClick: () => void; disabled?: boolean; destructive?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex size-6 items-center justify-center rounded transition-colors disabled:pointer-events-none disabled:opacity-30',
        destructive ? 'text-muted-fg hover:bg-red-500/10 hover:text-red-600' : 'text-muted-fg hover:bg-muted hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}
