/**
 * Derive display badges for a website's cross-cutting statuses. PURE (no Prisma) so
 * it is unit-testable and reusable on client and server. Deployment/Domain systems
 * are future milestones, so those return placeholder states from the aggregate.
 */

export type Tone = 'neutral' | 'success' | 'warning' | 'info';

export interface StatusBadge {
  label: string;
  tone: Tone;
}

export interface WebsiteStatusInput {
  status: 'DRAFT' | 'GENERATED' | 'PUBLISHED' | 'ARCHIVED' | 'TRASHED';
  generatedAt?: Date | string | null;
  seoConfig?: unknown;
}

/** Lifecycle badge from the website status. */
export function lifecycleBadge(w: WebsiteStatusInput): StatusBadge {
  switch (w.status) {
    case 'PUBLISHED':
      return { label: 'Published', tone: 'success' };
    case 'GENERATED':
      return { label: 'Generated', tone: 'info' };
    case 'ARCHIVED':
      return { label: 'Archived', tone: 'neutral' };
    case 'TRASHED':
      return { label: 'Trashed', tone: 'neutral' };
    case 'DRAFT':
    default:
      return { label: 'Draft', tone: 'warning' };
  }
}

/** Whether content has been generated yet. */
export function generationBadge(w: WebsiteStatusInput): StatusBadge {
  const generated = Boolean(w.generatedAt) || w.status === 'GENERATED' || w.status === 'PUBLISHED';
  return generated
    ? { label: 'Generated', tone: 'success' }
    : { label: 'Not generated', tone: 'warning' };
}

/** SEO configured? (based on a present seoConfig snapshot). */
export function seoBadge(w: WebsiteStatusInput): StatusBadge {
  const configured = w.seoConfig != null && (typeof w.seoConfig !== 'object' || Object.keys(w.seoConfig as object).length > 0);
  return configured
    ? { label: 'Configured', tone: 'success' }
    : { label: 'Not configured', tone: 'neutral' };
}

/** Deployment status — placeholder until the Deployment milestone. */
export function deploymentBadge(): StatusBadge {
  return { label: 'Not deployed', tone: 'neutral' };
}

/** Domain status — placeholder until the Domain milestone. */
export function domainBadge(): StatusBadge {
  return { label: 'No domain', tone: 'neutral' };
}
