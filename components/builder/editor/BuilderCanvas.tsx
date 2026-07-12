'use client';

import * as React from 'react';
import { ThemeProvider } from '@/components/builder/ThemeProvider';
import { BlockRenderer } from '@/components/builder/BlockRenderer';
import type { BlockContext } from '@/lib/builder/types';
import type { BuilderDocument, GlobalStyles } from '@/lib/builder/editor/types';
import { cn } from '@/lib/utils';

/**
 * Live preview canvas. REUSES `ThemeProvider` + `BlockRenderer` (no duplicated
 * rendering) to render the working `PageDefinition` with the real block components.
 * Overlays a transparent click layer per block for select-to-edit. Global style
 * overrides are applied as CSS variables layered over the theme.
 */
function globalStyleVars(styles: GlobalStyles): React.CSSProperties {
  const vars: Record<string, string> = {};
  if (styles.brand) vars['--brand'] = styles.brand;
  if (styles.accent) vars['--accent'] = styles.accent;
  if (styles.radius) vars['--radius'] = styles.radius;
  if (styles.fontFamily) vars['--font-sans'] = styles.fontFamily;
  return vars as React.CSSProperties;
}

export function BuilderCanvas({
  doc,
  ctx,
  selectedId,
  onSelect,
}: {
  doc: BuilderDocument;
  ctx: BlockContext;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div style={globalStyleVars(doc.globalStyles)}>
      <ThemeProvider themeId={doc.themeId}>
        <div className="relative">
          {doc.page.blocks.map((block, i) => {
            const id = block.id ?? `${block.type}-${i}`;
            const active = id === selectedId;
            return (
              <div key={id} className="relative">
                <BlockRenderer page={{ blocks: [block] }} ctx={ctx} />
                {/* Click-to-select overlay + selection outline. */}
                <button
                  type="button"
                  aria-label={`Select ${block.type} block`}
                  onClick={() => onSelect(id)}
                  className={cn(
                    'absolute inset-0 z-10 block w-full cursor-pointer ring-inset transition-shadow',
                    active ? 'ring-2 ring-brand' : 'hover:ring-2 hover:ring-brand/40',
                  )}
                />
              </div>
            );
          })}
          {doc.page.blocks.length === 0 ? (
            <div className="p-16 text-center text-sm text-muted-fg">
              This page is empty. Add a block from the left panel.
            </div>
          ) : null}
        </div>
      </ThemeProvider>
    </div>
  );
}
