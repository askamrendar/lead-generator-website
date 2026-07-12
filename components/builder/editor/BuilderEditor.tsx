'use client';

import * as React from 'react';
import { useToast } from '@/components/ui/toast';
import { BuilderToolbar } from '@/components/builder/editor/BuilderToolbar';
import { BlockListPanel } from '@/components/builder/editor/BlockListPanel';
import { InspectorPanel } from '@/components/builder/editor/InspectorPanel';
import { BuilderCanvas } from '@/components/builder/editor/BuilderCanvas';
import { DeviceFrame } from '@/components/builder/editor/DeviceFrame';
import {
  initHistory,
  push,
  undo as undoHist,
  redo as redoHist,
  canUndo as histCanUndo,
  canRedo as histCanRedo,
  type History,
} from '@/lib/builder/editor/history';
import {
  addBlock,
  deleteBlock,
  duplicateBlock,
  moveBlockById,
  reorderBlocks,
  updateBlockProps,
  ensureIds,
  findBlock,
} from '@/lib/builder/editor/operations';
import { withTheme, withGlobalStyles, restoreRevision } from '@/lib/builder/editor/document';
import { saveDraftAction, publishAction } from '@/app/dashboard/websites/[websiteId]/builder/actions';
import type { BlockContext, PageDefinition, ThemeId } from '@/lib/builder/types';
import type { BuilderDocument, DeviceMode, GlobalStyles } from '@/lib/builder/editor/types';

/**
 * Visual Builder orchestrator (client). Owns the edit history (undo/redo over the
 * PageDefinition), autosaves debounced through the tenant-access server action,
 * wires keyboard shortcuts, and composes the toolbar + panels + live canvas. It edits
 * the `builderConfig` document ONLY — rendering is delegated to `BuilderCanvas`
 * (which reuses `BlockRenderer`).
 */

let idSeq = 0;
function nextId(base: string): string {
  idSeq += 1;
  return `${base}-${idSeq}-${Date.now().toString(36)}`;
}

export function BuilderEditor({
  websiteId,
  websiteName,
  initialDocument,
  previewCtx,
}: {
  websiteId: string;
  websiteName: string;
  initialDocument: BuilderDocument;
  previewCtx: BlockContext;
}) {
  const { toast } = useToast();

  // Doc-level state (theme/globalStyles/status/revisions) + page history.
  const [doc, setDoc] = React.useState<BuilderDocument>(initialDocument);
  const [pageHist, setPageHist] = React.useState<History<PageDefinition>>(() =>
    initHistory(ensureIds(initialDocument.page)),
  );
  const [selectedId, setSelectedId] = React.useState<string | null>(
    initialDocument.page.blocks[0]?.id ?? null,
  );
  const [device, setDevice] = React.useState<DeviceMode>('desktop');
  const [saveState, setSaveState] = React.useState<'idle' | 'saving' | 'saved'>('idle');
  const [publishing, setPublishing] = React.useState(false);

  // The full document reflecting the current page-history present.
  const currentDoc = React.useMemo<BuilderDocument>(
    () => ({ ...doc, page: pageHist.present }),
    [doc, pageHist.present],
  );

  // --- Autosave (debounced) --------------------------------------------------
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleSave = React.useCallback(
    (next: BuilderDocument) => {
      setSaveState('saving');
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        const res = await saveDraftAction(websiteId, next);
        if (res.ok) setSaveState('saved');
        else {
          setSaveState('idle');
          toast({ variant: 'error', title: 'Autosave failed', description: res.error });
        }
      }, 800);
    },
    [websiteId, toast],
  );

  React.useEffect(() => {
    scheduleSave(currentDoc);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // Save whenever the working document changes.
  }, [currentDoc, scheduleSave]);

  // --- Page edits (go through history) ---------------------------------------
  const commitPage = React.useCallback((nextPage: PageDefinition) => {
    setPageHist((h) => push(h, nextPage));
  }, []);

  const selected = selectedId ? findBlock(pageHist.present, selectedId) ?? null : null;

  const onAdd = (type: string) => {
    const id = nextId(type);
    commitPage(addBlock(pageHist.present, { type, id, props: {} }));
    setSelectedId(id);
  };
  const onDelete = (id: string) => {
    commitPage(deleteBlock(pageHist.present, id));
    if (selectedId === id) setSelectedId(null);
  };
  const onDuplicate = (id: string) => commitPage(duplicateBlock(pageHist.present, id, nextId));
  const onMove = (id: string, delta: number) => commitPage(moveBlockById(pageHist.present, id, delta));
  const onReorder = (ids: string[]) => commitPage(reorderBlocks(pageHist.present, ids));
  const onUpdateProps = (id: string, patch: Record<string, unknown>) =>
    commitPage(updateBlockProps(pageHist.present, id, patch));

  // --- Doc-level edits (theme / global styles / restore) ---------------------
  const onTheme = (themeId: ThemeId) => setDoc((d) => withTheme({ ...d, page: pageHist.present }, themeId));
  const onGlobalStyles = (patch: GlobalStyles) => setDoc((d) => withGlobalStyles({ ...d, page: pageHist.present }, patch));
  const onRestore = (revisionId: string) => {
    const restored = restoreRevision({ ...doc, page: pageHist.present }, revisionId);
    setDoc(restored);
    setPageHist((h) => push(h, ensureIds(restored.page)));
    toast({ variant: 'success', title: 'Revision restored' });
  };

  // --- Undo / redo -----------------------------------------------------------
  const onUndo = React.useCallback(() => setPageHist((h) => undoHist(h)), []);
  const onRedo = React.useCallback(() => setPageHist((h) => redoHist(h)), []);

  // --- Publish ---------------------------------------------------------------
  const onPublish = async () => {
    setPublishing(true);
    const res = await publishAction(websiteId, currentDoc, new Date().toISOString(), nextId('rev'));
    setPublishing(false);
    if (res.ok && res.document) {
      setDoc(res.document);
      toast({ variant: 'success', title: 'Website published' });
    } else if (!res.ok) {
      toast({ variant: 'error', title: 'Publish failed', description: res.error });
    }
  };

  // --- Keyboard shortcuts ----------------------------------------------------
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const typing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'z' && !typing) {
        e.preventDefault();
        if (e.shiftKey) onRedo();
        else onUndo();
      } else if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault(); // autosave already covers it; suppress browser save
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && !typing && selectedId) {
        e.preventDefault();
        onDelete(selectedId);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, onUndo, onRedo]);

  return (
    <div className="flex h-dvh flex-col">
      <BuilderToolbar
        websiteId={websiteId}
        websiteName={websiteName}
        device={device}
        onDevice={setDevice}
        canUndo={histCanUndo(pageHist)}
        canRedo={histCanRedo(pageHist)}
        onUndo={onUndo}
        onRedo={onRedo}
        saveState={saveState}
        status={currentDoc.status}
        onPublish={onPublish}
        publishing={publishing}
      />
      <div className="flex min-h-0 flex-1">
        <BlockListPanel
          blocks={pageHist.present.blocks}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onReorder={onReorder}
          onMove={onMove}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          onAdd={onAdd}
        />
        <main className="min-w-0 flex-1 overflow-y-auto">
          <DeviceFrame device={device}>
            <BuilderCanvas doc={currentDoc} ctx={previewCtx} selectedId={selectedId} onSelect={setSelectedId} />
          </DeviceFrame>
        </main>
        <InspectorPanel
          selected={selected}
          doc={currentDoc}
          onUpdateProps={onUpdateProps}
          onTheme={onTheme}
          onGlobalStyles={onGlobalStyles}
          onRestore={onRestore}
        />
      </div>
    </div>
  );
}
