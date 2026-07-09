import { getBlock } from '@/lib/builder/blocks/registry';
import type { BlockContext, PageDefinition } from '@/lib/builder/types';

/**
 * Render engine. Walks a JSON PageDefinition and renders each block via the
 * registry, passing the shared BlockContext. Unknown block types are skipped
 * (in dev, a small marker is shown) so a bad definition never crashes a page.
 */
export function BlockRenderer({
  page,
  ctx,
}: {
  page: PageDefinition;
  ctx: BlockContext;
}) {
  return (
    <>
      {page.blocks.map((block, i) => {
        const Block = getBlock(block.type);
        if (!Block) {
          if (process.env.NODE_ENV !== 'production') {
            return (
              <div
                key={`${block.type}-${i}`}
                className="container my-2 rounded border border-dashed border-red-300 bg-red-50 p-2 text-xs text-red-600"
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
