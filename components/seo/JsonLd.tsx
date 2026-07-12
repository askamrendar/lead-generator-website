/**
 * Renders a JSON-LD structured-data block. Server component — the script is
 * emitted inline so crawlers see it without executing JS.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  // Escape `<` so a `</script>` sequence in any (current or future) data field cannot
  // break out of the script element — defense-in-depth even though today's inputs are
  // config-derived. JSON.stringify does not escape `<`/`>` on its own.
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
