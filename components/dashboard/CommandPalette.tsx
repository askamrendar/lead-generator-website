'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Globe,
  Search,
  Zap,
  Compass,
  type LucideIcon,
} from 'lucide-react';
import {
  staticCommands,
  filterCommands,
  groupResults,
} from '@/lib/search/registry';
import { searchWorkspace } from '@/app/dashboard/search-actions';
import type { SearchGroup, SearchResult } from '@/lib/search/types';
import { cn } from '@/lib/utils';

/**
 * Reusable command palette (⌘K / Ctrl+K). Static commands (actions + navigation)
 * resolve instantly on the client; entity results (websites, extensible to more) come
 * from a tenant-scoped server action, debounced. Full keyboard support. Open state is
 * owned by the shell (which registers the global shortcut).
 */
const GROUP_ICON: Record<SearchGroup, LucideIcon> = {
  Actions: Zap,
  Navigate: Compass,
  Websites: Globe,
  Projects: Globe,
  Templates: Globe,
  Pages: Globe,
  Prompts: Globe,
  Domains: Globe,
  Deployments: Globe,
  Media: Globe,
};

export function CommandPalette({
  open,
  onOpenChange,
  workspaceId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState('');
  const [remote, setRemote] = React.useState<SearchResult[]>([]);
  const [active, setActive] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const grouped = React.useMemo(() => {
    const statics = filterCommands(staticCommands(), query);
    return groupResults([...statics, ...remote]);
  }, [query, remote]);
  const flat = React.useMemo(() => grouped.flatMap(([, items]) => items), [grouped]);

  // Reset + focus on open; lock body scroll.
  React.useEffect(() => {
    if (!open) return;
    setQuery('');
    setRemote([]);
    setActive(0);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    return () => {
      document.body.style.overflow = prev;
      clearTimeout(t);
    };
  }, [open]);

  // Debounced tenant-scoped entity search.
  React.useEffect(() => {
    if (!open || !workspaceId) return;
    const q = query.trim();
    if (!q) {
      setRemote([]);
      return;
    }
    const t = setTimeout(async () => {
      const results = await searchWorkspace(workspaceId, q);
      setRemote(results);
    }, 180);
    return () => clearTimeout(t);
  }, [query, open, workspaceId]);

  React.useEffect(() => {
    setActive((a) => Math.min(a, Math.max(0, flat.length - 1)));
  }, [flat.length]);

  if (!open) return null;

  function go(result: SearchResult | undefined) {
    if (!result) return;
    onOpenChange(false);
    router.push(result.href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, flat.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(flat[active]);
    } else if (e.key === 'Escape') {
      onOpenChange(false);
    }
  }

  let index = -1;

  return (
    <div className="fixed inset-0 z-[95] flex items-start justify-center p-4 pt-[12vh]">
      <div className="absolute inset-0 bg-black/50" onClick={() => onOpenChange(false)} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="relative z-10 w-full max-w-xl overflow-hidden rounded-xl border border-border bg-background shadow-2xl animate-fade-up"
      >
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search className="size-4 shrink-0 text-muted-fg" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search websites, actions, pages…"
            aria-label="Search"
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-fg"
          />
          <kbd className="hidden shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-fg sm:inline">
            ESC
          </kbd>
        </div>

        <div role="listbox" aria-label="Results" className="max-h-[50vh] overflow-y-auto p-2">
          {flat.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-fg">No results.</p>
          ) : (
            grouped.map(([group, items]) => {
              const Icon = GROUP_ICON[group];
              return (
                <div key={group} className="mb-1">
                  <p className="px-2 py-1.5 text-xs font-medium text-muted-fg">{group}</p>
                  {items.map((r) => {
                    index += 1;
                    const isActive = index === active;
                    const selfIndex = index;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        onMouseEnter={() => setActive(selfIndex)}
                        onClick={() => go(r)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left text-sm transition-colors',
                          isActive ? 'bg-muted' : 'hover:bg-muted',
                        )}
                      >
                        <Icon className="size-4 shrink-0 text-muted-fg" aria-hidden />
                        <span className="min-w-0 flex-1 truncate text-foreground">{r.title}</span>
                        {r.subtitle ? (
                          <span className="truncate text-xs text-muted-fg">{r.subtitle}</span>
                        ) : null}
                        <ArrowRight
                          className={cn('size-4 shrink-0 text-muted-fg', isActive ? 'opacity-100' : 'opacity-0')}
                          aria-hidden
                        />
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
