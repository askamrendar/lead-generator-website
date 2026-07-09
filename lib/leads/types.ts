import type { LeadInput } from '@/lib/forms/lead';

/** A validated lead enriched with server-side capture metadata. */
export interface LeadRecord extends LeadInput {
  id: string;
  createdAt: string;
  source: string;
  ip?: string;
  userAgent?: string;
}

/** Result of a single delivery sink (persistence, CRM, email, webhook). */
export interface SinkResult {
  sink: string;
  ok: boolean;
  /** True when the sink was not configured and was intentionally skipped. */
  skipped?: boolean;
  error?: string;
}

/**
 * A lead delivery sink. Implementations must never throw — they resolve to a
 * `SinkResult` describing success, skip, or failure so the pipeline can decide
 * the overall outcome.
 */
export interface LeadSink {
  name: string;
  deliver(lead: LeadRecord): Promise<SinkResult>;
}

export interface DeliveryOutcome {
  ok: boolean;
  id: string;
  results: SinkResult[];
}
