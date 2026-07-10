import { z } from 'zod';

/**
 * Website-creation wizard schemas — PURE (only `zod`), so they are shared by the
 * client wizard and the server action and are unit-testable in isolation
 * (tests/website-schema.test.mjs). The wizard collects **configuration only**;
 * generation happens in a later milestone.
 *
 * One schema per step + a composed `websiteWizardSchema` for the final submit.
 */

const trimmedName = z.string().trim().min(2, 'Enter at least 2 characters').max(120);

/** Comma/newline separated list → cleaned string[]. */
const csvList = z
  .string()
  .optional()
  .transform((v) =>
    (v ?? '')
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean),
  );

export const businessStepSchema = z.object({
  businessName: trimmedName,
  category: z.string().trim().min(2, 'Choose a category').max(80),
  primaryService: z.string().trim().min(2, 'Enter your primary service').max(120),
  additionalServices: csvList,
});

export const locationStepSchema = z.object({
  country: z.string().trim().min(2).max(60).default('United States'),
  state: z.string().trim().min(2, 'Enter a state').max(60),
  city: z.string().trim().min(2, 'Enter a city').max(80),
  zipCodes: csvList,
  neighborhoods: csvList,
});

const hexColor = z
  .string()
  .trim()
  .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Use a hex color like #2563eb');

export const brandStepSchema = z.object({
  logoUrl: z.string().trim().url('Enter a valid URL').or(z.literal('')).optional(),
  primaryColor: hexColor.default('#2563eb'),
  accentColor: hexColor.default('#f97316'),
  fontFamily: z.string().trim().max(60).default('Inter'),
});

export const detailsStepSchema = z.object({
  phone: z.string().trim().min(7, 'Enter a valid phone').max(32),
  email: z.string().trim().email('Enter a valid email').max(254),
  hours: z.string().trim().max(500).optional().default(''),
  website: z.string().trim().url().or(z.literal('')).optional(),
  facebook: z.string().trim().url().or(z.literal('')).optional(),
  instagram: z.string().trim().url().or(z.literal('')).optional(),
  x: z.string().trim().url().or(z.literal('')).optional(),
});

export const seoStepSchema = z.object({
  targetKeywords: csvList,
  competitors: csvList,
  servicePages: z.coerce.number().int().min(0).max(200).default(5),
  locationPages: z.coerce.number().int().min(0).max(500).default(10),
});

/** Full wizard payload (all steps merged) — used by the create action. */
export const websiteWizardSchema = z.object({
  business: businessStepSchema,
  location: locationStepSchema,
  brand: brandStepSchema,
  details: detailsStepSchema,
  seo: seoStepSchema,
});

export type BusinessStep = z.infer<typeof businessStepSchema>;
export type LocationStep = z.infer<typeof locationStepSchema>;
export type BrandStep = z.infer<typeof brandStepSchema>;
export type DetailsStep = z.infer<typeof detailsStepSchema>;
export type SeoStep = z.infer<typeof seoStepSchema>;
export type WebsiteWizardInput = z.infer<typeof websiteWizardSchema>;

/** Rename/settings form. */
export const renameWebsiteSchema = z.object({
  name: trimmedName,
});
export type RenameWebsiteInput = z.infer<typeof renameWebsiteSchema>;
