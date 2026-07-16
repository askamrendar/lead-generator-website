/**
 * Deterministic SVG favicon for generated websites — the business initial on a
 * rounded brand-color tile. Pure string builder (no imports) so it is trivially
 * unit-testable and usable from both the export pipeline and future surfaces.
 */

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * @param name business name — the first letter becomes the glyph
 * @param brandHsl theme brand color as an HSL triplet, e.g. "221 83% 53%"
 */
export function faviconSvg(name: string, brandHsl: string): string {
  const letter = escapeXml((name.trim()[0] ?? 'S').toUpperCase());
  const fill = `hsl(${brandHsl})`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">` +
    `<rect width="64" height="64" rx="14" fill="${fill}"/>` +
    `<text x="32" y="44" font-family="system-ui, -apple-system, sans-serif" font-size="36" font-weight="700" text-anchor="middle" fill="#ffffff">${letter}</text>` +
    `</svg>`
  );
}
