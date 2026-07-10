'use server';

import { listWorkspaceWebsites } from '@/lib/websites/service';
import { websiteHref } from '@/lib/websites/nav';
import { isAccessError } from '@/lib/auth/access';
import type { SearchResult } from '@/lib/search/types';

/**
 * Tenant-scoped entity search for the command palette. Reuses the website service
 * (which enforces `requireWorkspaceAccess`), so results never cross tenants. Returns
 * an empty list on an access error. Add more entity searches here as those modules
 * land — the palette renders any SearchResult[].
 */
export async function searchWorkspace(
  workspaceId: string,
  query: string,
): Promise<SearchResult[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  try {
    const sites = await listWorkspaceWebsites(workspaceId, { includeArchived: true });
    return sites
      .filter((w) => w.name.toLowerCase().includes(q) || w.slug.toLowerCase().includes(q))
      .slice(0, 6)
      .map((w) => ({
        id: `web:${w.id}`,
        title: w.name,
        subtitle: `/${w.slug}`,
        href: websiteHref(w.id, ''),
        group: 'Websites' as const,
      }));
  } catch (err) {
    if (isAccessError(err)) return [];
    throw err;
  }
}
