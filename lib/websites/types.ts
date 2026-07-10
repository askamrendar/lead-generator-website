import type { WebsiteWizardInput } from '@/lib/websites/schema';

/**
 * Website DTOs shared by the service and UI. The DB row is never handed to the
 * client raw; the service maps to these plain shapes.
 */

export type WebsiteStatus = 'DRAFT' | 'GENERATED' | 'PUBLISHED' | 'ARCHIVED';

/** The wizard-collected business configuration, stored on `Website.businessConfig`. */
export type WebsiteBusinessConfig = WebsiteWizardInput;

/** Row shape for lists/tables. */
export interface WebsiteSummary {
  id: string;
  name: string;
  slug: string;
  status: WebsiteStatus;
  industryId: string | null;
  themeId: string | null;
  templateId: string | null;
  language: string;
  timezone: string;
  generatedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Full detail shape (adds the stored business config). */
export interface WebsiteDetail extends WebsiteSummary {
  businessConfig: WebsiteBusinessConfig | null;
}
