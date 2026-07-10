// Relative `.ts` value import (not the `@/` alias) so the Node type-stripping test
// runner can resolve it. Type-only imports may keep the alias (they are erased).
import { NAV_ITEMS } from '../dashboard/nav.ts';
import type { SearchResult } from '@/lib/search/types';

/**
 * Static (client-resolvable) search commands: quick actions + every dashboard
 * destination. PURE, so it is unit-testable (tests/search.test.mjs) and cheap to
 * filter on each keystroke. Remote/entity results (websites, …) come from server
 * actions and are concatenated by the palette.
 */

const ACTIONS: SearchResult[] = [
  { id: 'act:new-website', title: 'Create new website', subtitle: 'Guided wizard', href: '/dashboard/websites/new', group: 'Actions' },
  { id: 'act:ai', title: 'Generate with AI', subtitle: 'AI Generator', href: '/dashboard/ai-generator', group: 'Actions' },
  { id: 'act:settings', title: 'Open settings', subtitle: 'Workspace & account', href: '/dashboard/settings', group: 'Actions' },
];

export function staticCommands(): SearchResult[] {
  const nav: SearchResult[] = NAV_ITEMS.map((i) => ({
    id: `nav:${i.href}`,
    title: i.label,
    subtitle: 'Go to',
    href: i.href,
    group: 'Navigate',
  }));
  return [...ACTIONS, ...nav];
}

/** Case-insensitive substring filter over title + subtitle. */
export function filterCommands(commands: SearchResult[], query: string): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return commands;
  return commands.filter(
    (c) => c.title.toLowerCase().includes(q) || (c.subtitle?.toLowerCase().includes(q) ?? false),
  );
}

/** Stable group order for rendering. */
export const GROUP_ORDER: SearchResult['group'][] = [
  'Actions',
  'Websites',
  'Projects',
  'Templates',
  'Pages',
  'Prompts',
  'Domains',
  'Deployments',
  'Media',
  'Navigate',
];

/** Group results preserving GROUP_ORDER. */
export function groupResults(results: SearchResult[]): [SearchResult['group'], SearchResult[]][] {
  const map = new Map<SearchResult['group'], SearchResult[]>();
  for (const r of results) {
    const list = map.get(r.group) ?? [];
    list.push(r);
    map.set(r.group, list);
  }
  return GROUP_ORDER.filter((g) => map.has(g)).map((g) => [g, map.get(g)!]);
}
