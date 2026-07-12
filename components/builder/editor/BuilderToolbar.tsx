'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Redo2,
  Undo2,
  Monitor,
  Tablet,
  Smartphone,
  Rocket,
  Check,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DeviceMode, BuilderStatus } from '@/lib/builder/editor/types';
import { cn } from '@/lib/utils';

type SaveState = 'idle' | 'saving' | 'saved';

const DEVICES: { key: DeviceMode; icon: typeof Monitor; label: string }[] = [
  { key: 'desktop', icon: Monitor, label: 'Desktop' },
  { key: 'tablet', icon: Tablet, label: 'Tablet' },
  { key: 'mobile', icon: Smartphone, label: 'Mobile' },
];

export function BuilderToolbar({
  websiteId,
  websiteName,
  device,
  onDevice,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  saveState,
  status,
  onPublish,
  publishing,
}: {
  websiteId: string;
  websiteName: string;
  device: DeviceMode;
  onDevice: (d: DeviceMode) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  saveState: SaveState;
  status: BuilderStatus;
  onPublish: () => void;
  publishing: boolean;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-3">
      <Button asChild variant="ghost" size="sm">
        <Link href={`/dashboard/websites/${websiteId}`}>
          <ArrowLeft aria-hidden />
          <span className="hidden sm:inline">Exit</span>
        </Link>
      </Button>
      <span className="truncate text-sm font-semibold text-foreground">{websiteName}</span>
      <span
        className={cn(
          'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase',
          status === 'PUBLISHED' ? 'bg-green-500/15 text-green-700 dark:text-green-400' : 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
        )}
      >
        {status === 'PUBLISHED' ? 'Published' : 'Draft'}
      </span>

      {/* Undo / redo */}
      <div className="ml-2 flex items-center gap-1">
        <IconBtn label="Undo (⌘Z)" onClick={onUndo} disabled={!canUndo}><Undo2 className="size-4" aria-hidden /></IconBtn>
        <IconBtn label="Redo (⌘⇧Z)" onClick={onRedo} disabled={!canRedo}><Redo2 className="size-4" aria-hidden /></IconBtn>
      </div>

      {/* Device modes */}
      <div className="mx-auto flex items-center gap-1 rounded-md border border-border p-0.5">
        {DEVICES.map((d) => (
          <button
            key={d.key}
            type="button"
            onClick={() => onDevice(d.key)}
            aria-label={d.label}
            aria-pressed={device === d.key}
            className={cn(
              'flex size-8 items-center justify-center rounded transition-colors',
              device === d.key ? 'bg-muted text-foreground' : 'text-muted-fg hover:bg-muted',
            )}
          >
            <d.icon className="size-4" aria-hidden />
          </button>
        ))}
      </div>

      {/* Save state + publish */}
      <div className="flex items-center gap-2">
        <span className="hidden items-center gap-1 text-xs text-muted-fg sm:flex" aria-live="polite">
          {saveState === 'saving' ? (<><Loader2 className="size-3.5 animate-spin" aria-hidden /> Saving…</>) : null}
          {saveState === 'saved' ? (<><Check className="size-3.5 text-green-600 dark:text-green-400" aria-hidden /> Saved</>) : null}
        </span>
        <Button size="sm" onClick={onPublish} disabled={publishing}>
          {publishing ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Rocket aria-hidden />}
          Publish
        </Button>
      </div>
    </header>
  );
}

function IconBtn({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="flex size-8 items-center justify-center rounded-md text-muted-fg transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  );
}
