'use client';

import * as React from 'react';
import { History, Palette, SlidersHorizontal } from 'lucide-react';
import { listThemes } from '@/themes/registry';
import { blockMeta } from '@/lib/builder/editor/block-meta';
import type { BlockInstance, ThemeId } from '@/lib/builder/types';
import type { BuilderDocument, GlobalStyles, Revision } from '@/lib/builder/editor/types';
import { cn } from '@/lib/utils';

type Tab = 'block' | 'style' | 'history';

/**
 * Right rail: three tabs.
 *  - Block: inline/rich-text/image field editors for the selected block (writes props).
 *  - Style: theme picker + color/typography/global-style overrides (writes doc-level).
 *  - History: revision list with restore.
 * All edits are reported up; this panel holds no source-of-truth state.
 */
export function InspectorPanel({
  selected,
  doc,
  onUpdateProps,
  onTheme,
  onGlobalStyles,
  onRestore,
}: {
  selected: BlockInstance | null;
  doc: BuilderDocument;
  onUpdateProps: (id: string, patch: Record<string, unknown>) => void;
  onTheme: (id: ThemeId) => void;
  onGlobalStyles: (patch: GlobalStyles) => void;
  onRestore: (revisionId: string) => void;
}) {
  const [tab, setTab] = React.useState<Tab>('block');

  return (
    <aside className="flex w-72 shrink-0 flex-col border-l border-border bg-background">
      <div className="flex border-b border-border">
        <TabButton active={tab === 'block'} onClick={() => setTab('block')} icon={SlidersHorizontal}>Block</TabButton>
        <TabButton active={tab === 'style'} onClick={() => setTab('style')} icon={Palette}>Style</TabButton>
        <TabButton active={tab === 'history'} onClick={() => setTab('history')} icon={History}>History</TabButton>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {tab === 'block' ? <BlockFields selected={selected} onUpdateProps={onUpdateProps} /> : null}
        {tab === 'style' ? <StyleFields doc={doc} onTheme={onTheme} onGlobalStyles={onGlobalStyles} /> : null}
        {tab === 'history' ? <RevisionList revisions={doc.revisions} onRestore={onRestore} /> : null}
      </div>
    </aside>
  );
}

function TabButton({ active, onClick, icon: Icon, children }: { active: boolean; onClick: () => void; icon: typeof Palette; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn('flex flex-1 items-center justify-center gap-1.5 border-b-2 py-2.5 text-xs font-medium transition-colors', active ? 'border-brand text-foreground' : 'border-transparent text-muted-fg hover:text-foreground')}
    >
      <Icon className="size-3.5" aria-hidden /> {children}
    </button>
  );
}

function fieldStr(block: BlockInstance, key: string): string {
  const v = block.props?.[key];
  return typeof v === 'string' ? v : '';
}

function BlockFields({ selected, onUpdateProps }: { selected: BlockInstance | null; onUpdateProps: (id: string, patch: Record<string, unknown>) => void }) {
  if (!selected) return <p className="text-sm text-muted-fg">Select a block to edit its content.</p>;
  const meta = blockMeta(selected.type);
  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-foreground">{meta.label}</p>
      {meta.fields.length === 0 ? (
        <p className="text-xs text-muted-fg">This block renders from generated content and has no inline overrides.</p>
      ) : (
        meta.fields.map((f) => (
          <div key={f.key} className="space-y-1">
            <label className="text-xs font-medium text-foreground" htmlFor={`f-${f.key}`}>{f.label}</label>
            {f.kind === 'richtext' ? (
              <textarea
                id={`f-${f.key}`}
                value={fieldStr(selected, f.key)}
                onChange={(e) => onUpdateProps(selected.id!, { [f.key]: e.target.value })}
                className="min-h-24 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand"
              />
            ) : (
              <input
                id={`f-${f.key}`}
                type={f.kind === 'image' ? 'url' : 'text'}
                value={fieldStr(selected, f.key)}
                placeholder={f.kind === 'image' ? 'https://…/image.jpg' : ''}
                onChange={(e) => onUpdateProps(selected.id!, { [f.key]: e.target.value })}
                className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand"
              />
            )}
            {f.kind === 'image' && fieldStr(selected, f.key) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fieldStr(selected, f.key)} alt="" className="mt-1 max-h-24 rounded border border-border object-cover" />
            ) : null}
          </div>
        ))
      )}
    </div>
  );
}

function StyleFields({ doc, onTheme, onGlobalStyles }: { doc: BuilderDocument; onTheme: (id: ThemeId) => void; onGlobalStyles: (patch: GlobalStyles) => void }) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-fg">Theme</p>
        <div className="grid grid-cols-2 gap-1.5">
          {listThemes().map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onTheme(t.id)}
              aria-pressed={doc.themeId === t.id}
              className={cn('rounded-md border px-2 py-1.5 text-xs capitalize transition-colors', doc.themeId === t.id ? 'border-brand bg-brand/5 text-foreground' : 'border-border text-muted-fg hover:bg-muted')}
            >
              {t.id}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-fg">Colors (global)</p>
        <ColorRow label="Brand" value={doc.globalStyles.brand ?? ''} onChange={(v) => onGlobalStyles({ brand: v || undefined })} />
        <ColorRow label="Accent" value={doc.globalStyles.accent ?? ''} onChange={(v) => onGlobalStyles({ accent: v || undefined })} />
        <p className="text-[10px] text-muted-fg">HSL triplet, e.g. <code>221 83% 53%</code>. Blank = theme default.</p>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-fg">Typography &amp; radius</p>
        <TextRow label="Font family" value={doc.globalStyles.fontFamily ?? ''} placeholder="Inter, system-ui, sans-serif" onChange={(v) => onGlobalStyles({ fontFamily: v || undefined })} />
        <TextRow label="Radius" value={doc.globalStyles.radius ?? ''} placeholder="0.75rem" onChange={(v) => onGlobalStyles({ radius: v || undefined })} />
      </div>
    </div>
  );
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-14 shrink-0 text-xs text-muted-fg">{label}</span>
      <span className="size-6 shrink-0 rounded border border-border" style={value ? { backgroundColor: `hsl(${value})` } : undefined} aria-hidden />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="H S% L%" className="h-8 w-full rounded-md border border-border bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand" />
    </div>
  );
}

function TextRow({ label, value, placeholder, onChange }: { label: string; value: string; placeholder?: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-14 shrink-0 text-xs text-muted-fg">{label}</span>
      <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="h-8 w-full rounded-md border border-border bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand" />
    </div>
  );
}

function RevisionList({ revisions, onRestore }: { revisions: Revision[]; onRestore: (id: string) => void }) {
  if (revisions.length === 0) return <p className="text-sm text-muted-fg">No revisions yet. Publishing creates a snapshot.</p>;
  return (
    <ul className="space-y-1.5">
      {revisions.map((r) => (
        <li key={r.id} className="flex items-center justify-between gap-2 rounded-md border border-border px-2.5 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm text-foreground">{r.label}</p>
            <p className="text-xs text-muted-fg">{new Date(r.at).toLocaleString()}</p>
          </div>
          <button type="button" onClick={() => onRestore(r.id)} className="shrink-0 text-xs font-medium text-brand hover:underline">Restore</button>
        </li>
      ))}
    </ul>
  );
}
