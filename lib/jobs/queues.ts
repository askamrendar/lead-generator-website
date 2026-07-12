// Phase 8.5 — Queue + handler registry. Pure metadata + a handler map.
// Handlers run as the SYSTEM; the enqueue call site is the authorization point.

export const QUEUES = [
  'ai',
  'deployment',
  'blog',
  'analytics-sync',
  'media-processing',
  'image-optimization',
  'email',
  'notification',
  'provider-sync',
] as const;

export type QueueName = (typeof QUEUES)[number];

export interface QueueMeta {
  name: QueueName;
  label: string;
  description: string;
  /** External dependency this queue's real work needs, if any (honest state). */
  requires?: string;
}

export const QUEUE_META: Record<QueueName, QueueMeta> = {
  ai: { name: 'ai', label: 'AI', description: 'AI website & content generation jobs.', requires: 'OpenAI/Anthropic credentials (Phase 10)' },
  deployment: { name: 'deployment', label: 'Deployment', description: 'Site build & publish jobs.' },
  blog: { name: 'blog', label: 'Blog', description: 'AI blog post generation jobs.', requires: 'AI credentials for live generation' },
  'analytics-sync': { name: 'analytics-sync', label: 'Analytics Sync', description: 'Pull GA4 / Search Console metrics.', requires: 'GA4 + Search Console credentials (Phase 10)' },
  'media-processing': { name: 'media-processing', label: 'Media Processing', description: 'Media ingestion & metadata jobs.' },
  'image-optimization': { name: 'image-optimization', label: 'Image Optimization', description: 'Responsive image derivative jobs.' },
  email: { name: 'email', label: 'Email', description: 'Transactional email delivery.', requires: 'Resend credentials (Phase 10)' },
  notification: { name: 'notification', label: 'Notification', description: 'In-app notification fan-out.' },
  'provider-sync': { name: 'provider-sync', label: 'Provider Sync', description: 'Refresh external provider status.', requires: 'Provider credentials (Phase 10)' },
};

/**
 * A job handler receives its typed-ish payload and returns a JSON-serialisable
 * result. Throwing marks the attempt failed (and triggers retry/backoff).
 */
export type JobHandler = (
  payload: Record<string, unknown>,
  ctx: { jobId: string; attempt: number },
) => Promise<Record<string, unknown> | void>;

const HANDLERS = new Map<string, JobHandler>();

export function registerHandler(type: string, handler: JobHandler): void {
  HANDLERS.set(type, handler);
}

export function getHandler(type: string): JobHandler | undefined {
  return HANDLERS.get(type);
}

export function registeredTypes(): string[] {
  return [...HANDLERS.keys()].sort();
}
