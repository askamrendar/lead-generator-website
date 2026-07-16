/**
 * USA geo pack — all 50 states + DC with USPS abbreviations and slugs.
 * Pure data + pure lookups (no I/O), so the wizard, the adapter, and tests all
 * share one source of truth. Fixes the `state.slice(0,2)` abbreviation bug
 * ("New York" → "NE"/Nebraska) and powers the wizard's state dropdown.
 */

export interface UsState {
  name: string;
  abbr: string;
  slug: string;
}

export const US_STATES: UsState[] = [
  { name: 'Alabama', abbr: 'AL', slug: 'alabama' },
  { name: 'Alaska', abbr: 'AK', slug: 'alaska' },
  { name: 'Arizona', abbr: 'AZ', slug: 'arizona' },
  { name: 'Arkansas', abbr: 'AR', slug: 'arkansas' },
  { name: 'California', abbr: 'CA', slug: 'california' },
  { name: 'Colorado', abbr: 'CO', slug: 'colorado' },
  { name: 'Connecticut', abbr: 'CT', slug: 'connecticut' },
  { name: 'Delaware', abbr: 'DE', slug: 'delaware' },
  { name: 'District of Columbia', abbr: 'DC', slug: 'district-of-columbia' },
  { name: 'Florida', abbr: 'FL', slug: 'florida' },
  { name: 'Georgia', abbr: 'GA', slug: 'georgia' },
  { name: 'Hawaii', abbr: 'HI', slug: 'hawaii' },
  { name: 'Idaho', abbr: 'ID', slug: 'idaho' },
  { name: 'Illinois', abbr: 'IL', slug: 'illinois' },
  { name: 'Indiana', abbr: 'IN', slug: 'indiana' },
  { name: 'Iowa', abbr: 'IA', slug: 'iowa' },
  { name: 'Kansas', abbr: 'KS', slug: 'kansas' },
  { name: 'Kentucky', abbr: 'KY', slug: 'kentucky' },
  { name: 'Louisiana', abbr: 'LA', slug: 'louisiana' },
  { name: 'Maine', abbr: 'ME', slug: 'maine' },
  { name: 'Maryland', abbr: 'MD', slug: 'maryland' },
  { name: 'Massachusetts', abbr: 'MA', slug: 'massachusetts' },
  { name: 'Michigan', abbr: 'MI', slug: 'michigan' },
  { name: 'Minnesota', abbr: 'MN', slug: 'minnesota' },
  { name: 'Mississippi', abbr: 'MS', slug: 'mississippi' },
  { name: 'Missouri', abbr: 'MO', slug: 'missouri' },
  { name: 'Montana', abbr: 'MT', slug: 'montana' },
  { name: 'Nebraska', abbr: 'NE', slug: 'nebraska' },
  { name: 'Nevada', abbr: 'NV', slug: 'nevada' },
  { name: 'New Hampshire', abbr: 'NH', slug: 'new-hampshire' },
  { name: 'New Jersey', abbr: 'NJ', slug: 'new-jersey' },
  { name: 'New Mexico', abbr: 'NM', slug: 'new-mexico' },
  { name: 'New York', abbr: 'NY', slug: 'new-york' },
  { name: 'North Carolina', abbr: 'NC', slug: 'north-carolina' },
  { name: 'North Dakota', abbr: 'ND', slug: 'north-dakota' },
  { name: 'Ohio', abbr: 'OH', slug: 'ohio' },
  { name: 'Oklahoma', abbr: 'OK', slug: 'oklahoma' },
  { name: 'Oregon', abbr: 'OR', slug: 'oregon' },
  { name: 'Pennsylvania', abbr: 'PA', slug: 'pennsylvania' },
  { name: 'Rhode Island', abbr: 'RI', slug: 'rhode-island' },
  { name: 'South Carolina', abbr: 'SC', slug: 'south-carolina' },
  { name: 'South Dakota', abbr: 'SD', slug: 'south-dakota' },
  { name: 'Tennessee', abbr: 'TN', slug: 'tennessee' },
  { name: 'Texas', abbr: 'TX', slug: 'texas' },
  { name: 'Utah', abbr: 'UT', slug: 'utah' },
  { name: 'Vermont', abbr: 'VT', slug: 'vermont' },
  { name: 'Virginia', abbr: 'VA', slug: 'virginia' },
  { name: 'Washington', abbr: 'WA', slug: 'washington' },
  { name: 'West Virginia', abbr: 'WV', slug: 'west-virginia' },
  { name: 'Wisconsin', abbr: 'WI', slug: 'wisconsin' },
  { name: 'Wyoming', abbr: 'WY', slug: 'wyoming' },
];

const byName = new Map<string, UsState>();
const byAbbr = new Map<string, UsState>();
for (const s of US_STATES) {
  byName.set(s.name.toLowerCase(), s);
  byAbbr.set(s.abbr.toLowerCase(), s);
}

/**
 * Resolve a user-typed state (full name OR abbreviation, any casing/spacing)
 * to the canonical record. "new york" → NY, "tx" → Texas. Null when unknown.
 */
export function findUsState(input: string): UsState | null {
  const clean = input.trim().replace(/\s+/g, ' ').toLowerCase();
  if (!clean) return null;
  return byName.get(clean) ?? byAbbr.get(clean) ?? null;
}

/**
 * Best-effort USPS abbreviation for a state input. Falls back to the first two
 * letters ONLY for non-US / unknown states (the generator schema requires 2 chars).
 */
export function usStateAbbr(input: string): string {
  return findUsState(input)?.abbr ?? input.trim().slice(0, 2).toUpperCase();
}

/** Validate a US ZIP: 5 digits, optionally ZIP+4. */
export function isValidUsZip(zip: string): boolean {
  return /^\d{5}(-\d{4})?$/.test(zip.trim());
}

/**
 * Clean a list of user-typed ZIPs: trim, split accidental space-joined pairs
 * ("87496 76032" → two entries), drop invalid ones, dedupe, cap at 50.
 */
export function cleanUsZips(zips: string[]): string[] {
  const out: string[] = [];
  for (const raw of zips) {
    for (const part of raw.split(/\s+/)) {
      const z = part.trim();
      if (isValidUsZip(z) && !out.includes(z)) out.push(z);
    }
  }
  return out.slice(0, 50);
}
