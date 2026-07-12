/**
 * Pure media helpers — MIME→kind classification, size formatting, filename safety.
 * No I/O, so unit-testable (tests/media-kind.test.mjs). Mirrors the Prisma
 * `MediaKind` enum values.
 */
export type MediaKind = 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'LOGO' | 'ICON' | 'OTHER';

export function mimeToKind(mime: string): MediaKind {
  const m = mime.toLowerCase();
  if (m === 'image/svg+xml') return 'ICON';
  if (m.startsWith('image/')) return 'IMAGE';
  if (m.startsWith('video/')) return 'VIDEO';
  if (m === 'application/pdf' || m.startsWith('application/') || m.startsWith('text/')) return 'DOCUMENT';
  return 'OTHER';
}

const ALLOWED_MIME = /^(image|video)\/|^application\/pdf$|^text\/plain$/i;

/** Whether an upload's MIME type is accepted by the library. */
export function isAllowedMime(mime: string): boolean {
  return ALLOWED_MIME.test(mime);
}

/** Filesystem-safe filename (strip path separators + control chars, cap length). */
export function safeFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? 'file';
  return base.replace(/[^\w.\- ]+/g, '_').slice(0, 120) || 'file';
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let n = bytes / 1024;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n.toFixed(n < 10 ? 1 : 0)} ${units[i]}`;
}

/** Case-insensitive search over filename + tags + alt text. */
export function matchesQuery(
  asset: { filename: string; altText?: string | null; tags: string[] },
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    asset.filename.toLowerCase().includes(q) ||
    (asset.altText?.toLowerCase().includes(q) ?? false) ||
    asset.tags.some((t) => t.toLowerCase().includes(q))
  );
}
