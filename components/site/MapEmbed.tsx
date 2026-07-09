/**
 * Keyless Google Maps embed via the public `q=` query. Good enough for a
 * generated marketing site; swap for the Embed API + key when you need styling.
 */
export function MapEmbed({ query, title }: { query: string; title: string }) {
  const src = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=12&ie=UTF8&iwloc=&output=embed`;
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <iframe
        title={title}
        src={src}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="h-72 w-full"
      />
    </div>
  );
}
