/**
 * Pure CSV builder for analytics exports — RFC-4180-ish escaping. No I/O, so
 * unit-testable (tests/analytics-csv.test.mjs). The UI turns the string into a Blob
 * download; PDF export uses the browser print path (no server dependency).
 */
export type CsvValue = string | number | boolean | null | undefined;

function escapeCell(value: CsvValue): string {
  const s = value == null ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Build CSV text from row objects. `columns` fixes column order + header labels;
 * when omitted, keys of the first row are used.
 */
export function toCsv(rows: Record<string, CsvValue>[], columns?: string[]): string {
  const cols = columns ?? (rows[0] ? Object.keys(rows[0]) : []);
  const header = cols.map(escapeCell).join(',');
  const body = rows.map((r) => cols.map((c) => escapeCell(r[c])).join(','));
  return [header, ...body].join('\n');
}
