import { NextResponse } from 'next/server';
import { leadSchema } from '@/lib/forms/lead';
import { enforceRateLimit } from '@/lib/api/security';
import { LIMITS } from '@/lib/api/rate-limit';

export const runtime = 'nodejs';

/**
 * Lead intake endpoint. Rate-limits abusive callers, validates the submission
 * server-side, silently drops honeypot hits, and is the single seam where you
 * wire a CRM / email / SMS notification.
 *
 * Accepts BOTH JSON (the in-app LeadForm) and form-encoded posts (the no-JS
 * plain <form> in exported static sites). Form posts get a friendly HTML
 * thank-you page back instead of JSON.
 */
export async function POST(request: Request) {
  const limited = enforceRateLimit(request, 'lead', LIMITS.lead());
  if (limited) return limited;

  const contentType = request.headers.get('content-type') ?? '';
  const isForm =
    contentType.includes('application/x-www-form-urlencoded') ||
    contentType.includes('multipart/form-data');

  let body: unknown;
  if (isForm) {
    try {
      const form = await request.formData();
      const val = (k: string) => {
        const v = form.get(k);
        return typeof v === 'string' && v.length > 0 ? v : undefined;
      };
      body = {
        name: val('name') ?? '',
        phone: val('phone') ?? '',
        email: val('email') ?? '',
        service: val('service'),
        message: val('message'),
        company: val('company'),
      };
    } catch {
      return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
    }
  } else {
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
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
    return isForm ? thankYouHtml() : NextResponse.json({ ok: true });
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

  return isForm ? thankYouHtml() : NextResponse.json({ ok: true });
}

/** Minimal thank-you page for no-JS form posts from exported static sites. */
function thankYouHtml(): NextResponse {
  const html =
    '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/>' +
    '<meta name="viewport" content="width=device-width, initial-scale=1"/>' +
    '<meta name="robots" content="noindex"/><title>Thank you</title></head>' +
    '<body style="font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0">' +
    '<div style="text-align:center;padding:2rem"><h1>Thanks — we&rsquo;ll be in touch!</h1>' +
    '<p>A team member will reach out shortly to confirm your appointment.</p>' +
    '<p><a href="javascript:history.back()">&larr; Go back</a></p></div></body></html>';
  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
