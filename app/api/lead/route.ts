import { NextResponse } from 'next/server';
import { leadSchema } from '@/lib/forms/lead';
import { enforceRateLimit } from '@/lib/api/security';
import { LIMITS } from '@/lib/api/rate-limit';

export const runtime = 'nodejs';

/**
 * Lead intake endpoint. Rate-limits abusive callers, validates the submission
 * server-side, silently drops honeypot hits, and is the single seam where you
 * wire a CRM / email / SMS notification.
 */
export async function POST(request: Request) {
  const limited = enforceRateLimit(request, 'lead', LIMITS.lead());
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  // Honeypot: silently accept but drop obvious bots.
  if (parsed.data.company) {
    return NextResponse.json({ ok: true });
  }

  const lead = parsed.data;

  try {
    // ── INTEGRATION SEAM ───────────────────────────────────────────────────
    // Wire your CRM / email / SMS here, e.g.:
    //   await sendToCrm(lead);
    //   await notifyByEmail(lead);
    // For the offline core we log server-side so submissions are observable.
    // Downstream delivery runs inside this try/catch so a provider outage
    // degrades to a 502 (prompting a client retry) instead of an unhandled
    // rejection — and never leaks the underlying error to the caller.
    console.info('[lead] new submission', {
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      service: lead.service,
    });
  } catch (err) {
    console.error('[lead] delivery failed', err);
    return NextResponse.json(
      { ok: false, error: 'Could not process your request. Please try again.' },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
