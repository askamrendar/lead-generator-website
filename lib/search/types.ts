/**
 * Global search types. Results are plain + serializable (no React nodes), so server
 * actions can return them and the client maps a group → icon. Extensible: add a group
 * and a provider (static in registry.ts or a server action) — the palette renders any
 * SearchResult without change.
 */
export type SearchGroup =
  | 'Actions'
  | 'Navigate'
  | 'Websites'
  | 'Projects'
  | 'Templates'
  | 'Pages'
  | 'Prompts'
  | 'Domains'
  | 'Deployments'
  | 'Media';

export interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  group: SearchGroup;
}
