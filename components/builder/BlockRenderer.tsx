import { getBlock } from '@/lib/builder/blocks/registry';
import type { BlockComponent, BlockContext, PageDefinition } from '@/lib/builder/types';

/**
 * Render engine. Walks a JSON PageDefinition and renders each block via the
 * registry, passing the shared BlockContext. Unknown block types are skipped
 * (in dev, a small marker is shown) so a bad definition never crashes a page.
 *
 * `overrides` substitutes specific block types with alternate components — used
 * by the static export to swap interactive blocks for no-JS-safe equivalents
 * without a second registry or page format.
 */
export function BlockRenderer({
  page,
  ctx,
  overrides,
}: {
  page: PageDefinition;
  ctx: BlockContext;
  overrides?: Record<string, BlockComponent>;
}) {
  return (
    <>
      {page.blocks.map((block, i) => {
        const Block = overrides?.[block.type] ?? getBlock(block.type);
        if (!Block) {
          if (process.env.NODE_ENV !== 'production') {
            return (
              <div
                key={`${block.type}-${i}`}
                className="container my-2 rounded border border-dashed border-red-300 bg-red-50 p-2 text-xs text-red-600 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400"
              >
                Unknown block type: <code>{block.type}</code>
              </div>
            );
          }
          return null;
        }
        return (
          <Block key={block.id ?? `${block.type}-${i}`} ctx={ctx} config={block.props ?? {}} />
        );
      })}
    </>
  );
}
