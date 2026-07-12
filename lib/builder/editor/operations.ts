import type { PageDefinition, BlockInstance } from '@/lib/builder/types';

/**
 * Pure block operations over a `PageDefinition`. Every function returns a NEW page
 * (immutable) — no rendering, no I/O, no clock — so they are exhaustively unit
 * -testable (tests/builder-operations.test.mjs) and drive both undo/redo and autosave.
 *
 * Block identity: the editor needs a stable `id` per block for drag/select/edit.
 * `ensureIds()` assigns deterministic ids (by index) to any block missing one.
 */

export function ensureIds(page: PageDefinition): PageDefinition {
  let counter = 0;
  const seen = new Set<string>();
  const blocks = page.blocks.map((b) => {
    let id = b.id;
    if (!id || seen.has(id)) id = `${b.type}-${counter}`;
    counter += 1;
    seen.add(id);
    return id === b.id ? b : { ...b, id };
  });
  return { ...page, blocks };
}

function indexOfId(page: PageDefinition, id: string): number {
  return page.blocks.findIndex((b) => b.id === id);
}

/** Insert a new block at `index` (clamped). Returns the new page. */
export function addBlock(
  page: PageDefinition,
  block: BlockInstance,
  index?: number,
): PageDefinition {
  const at = index === undefined ? page.blocks.length : Math.max(0, Math.min(index, page.blocks.length));
  const blocks = [...page.blocks];
  blocks.splice(at, 0, block);
  return { ...page, blocks };
}

/** Remove the block with `id`. No-op if absent. */
export function deleteBlock(page: PageDefinition, id: string): PageDefinition {
  return { ...page, blocks: page.blocks.filter((b) => b.id !== id) };
}

/** Duplicate the block with `id`, inserting the copy directly after it (fresh id). */
export function duplicateBlock(
  page: PageDefinition,
  id: string,
  newId: (base: string) => string,
): PageDefinition {
  const i = indexOfId(page, id);
  if (i < 0) return page;
  const source = page.blocks[i]!;
  const copy: BlockInstance = {
    ...source,
    id: newId(source.type),
    props: source.props ? { ...source.props } : undefined,
  };
  const blocks = [...page.blocks];
  blocks.splice(i + 1, 0, copy);
  return { ...page, blocks };
}

/** Move a block from one index to another (array reorder). */
export function moveBlock(page: PageDefinition, from: number, to: number): PageDefinition {
  const n = page.blocks.length;
  if (from < 0 || from >= n) return page;
  const dest = Math.max(0, Math.min(to, n - 1));
  if (dest === from) return page;
  const blocks = [...page.blocks];
  const [moved] = blocks.splice(from, 1);
  blocks.splice(dest, 0, moved!);
  return { ...page, blocks };
}

/** Move the block identified by `id` by a delta (±1 = up/down). */
export function moveBlockById(page: PageDefinition, id: string, delta: number): PageDefinition {
  const i = indexOfId(page, id);
  if (i < 0) return page;
  return moveBlock(page, i, i + delta);
}

/** Shallow-merge new props into a block (used by inline/rich-text/image/style edits). */
export function updateBlockProps(
  page: PageDefinition,
  id: string,
  patch: Record<string, unknown>,
): PageDefinition {
  return {
    ...page,
    blocks: page.blocks.map((b) =>
      b.id === id ? { ...b, props: { ...(b.props ?? {}), ...patch } } : b,
    ),
  };
}

/** Replace the entire ordered id list (drag-and-drop reorder result). */
export function reorderBlocks(page: PageDefinition, orderedIds: string[]): PageDefinition {
  const byId = new Map(page.blocks.map((b) => [b.id, b] as const));
  const reordered = orderedIds.map((id) => byId.get(id)).filter(Boolean) as BlockInstance[];
  // Append any blocks not named in orderedIds (safety — never drop content).
  const named = new Set(orderedIds);
  for (const b of page.blocks) if (!b.id || !named.has(b.id)) reordered.push(b);
  return { ...page, blocks: reordered };
}

export function findBlock(page: PageDefinition, id: string): BlockInstance | undefined {
  return page.blocks.find((b) => b.id === id);
}
