import { z } from 'zod';
import type { BusinessConfigInput } from '@/lib/generator/schema';

/**
 * Intake form schema — the human-facing shape the /generate form collects.
 * `intakeToConfig` maps it into a full BusinessConfig (which is then validated
 * by the business schema on the server). Keeping the form shape separate from
 * the domain model lets the UI stay simple while the config stays rich.
 */
export const intakeSchema = z.object({
  name: z.string().min(2, 'Business name is required'),
  category: z.string().min(2, 'Category is required (e.g. Plumbing)'),
  tagline: z.string().min(3, 'Add a short tagline'),
  description: z.string().min(20, 'Write at least a sentence or two'),
  primaryService: z.string().min(2, 'Primary service is required'),

  phone: z.string().min(7, 'Phone is required'),
  email: z.string().email('Valid email required'),

  street: z.string().min(2, 'Street is required'),
  city: z.string().min(2, 'City is required'),
  stateName: z.string().min(2, 'State name is required'),
  stateAbbr: z
    .string()
    .length(2, 'Use the 2-letter state code')
    .transform((s) => s.toUpperCase()),
  zip: z.string().min(3, 'ZIP is required'),

  brandPrimary: z.string().min(3).default('221 83% 53%'),
  brandAccent: z.string().min(3).default('24 95% 53%'),

  /** One service per line: "Name | short description" (description optional). */
  servicesRaw: z.string().min(2, 'Add at least one service'),
  /** One city per line: "City | zip,zip | neighborhood,neighborhood". */
  citiesRaw: z.string().min(2, 'Add at least one city'),

  siteUrl: z
    .string()
    .url('Must be a valid URL')
    .or(z.literal(''))
    .default(''),
});

export type IntakeInput = z.infer<typeof intakeSchema>;

function parseLine(line: string): string[] {
  return line.split('|').map((p) => p.trim());
}

function parseList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

/** Map validated intake input into a candidate BusinessConfig object. */
export function intakeToConfig(input: IntakeInput): BusinessConfigInput {
  const services = input.servicesRaw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, shortDescription] = parseLine(line);
      return {
        name,
        shortDescription:
          shortDescription || `Professional ${name.toLowerCase()} you can trust.`,
      };
    });

  const cities = input.citiesRaw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, zips, neighborhoods] = parseLine(line);
      return {
        name,
        zips: parseList(zips),
        neighborhoods: parseList(neighborhoods),
      };
    });

  return {
    name: input.name,
    category: input.category,
    tagline: input.tagline,
    description: input.description,
    primaryService: input.primaryService,
    phone: input.phone,
    email: input.email,
    address: {
      street: input.street,
      city: input.city,
      state: input.stateName,
      stateAbbr: input.stateAbbr,
      zip: input.zip,
    },
    brand: {
      primary: input.brandPrimary,
      primaryForeground: '0 0% 100%',
      accent: input.brandAccent,
      accentForeground: '0 0% 100%',
      radius: '0.75rem',
    },
    services,
    states: [
      {
        name: input.stateName,
        abbr: input.stateAbbr,
        cities,
      },
    ],
    siteUrl: input.siteUrl || 'http://localhost:3000',
  };
}
