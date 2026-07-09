/**
 * Renders a JSON-LD structured-data block. Server component — the script is
 * emitted inline so crawlers see it without executing JS.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is safe to inline; no user HTML is interpolated.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
