import { resolveSiteUrl } from '@/lib/site';

/**
 * Transactional email dispatch seam.
 *
 * Phase 7.1 ships the *architecture*, not a provider binding. With no email
 * provider configured (the default, offline-safe state) the action link is logged
 * to the server console so the flow is fully exercisable in development. Wiring a
 * real provider (Resend/SES/Postmark/SMTP) later means implementing only
 * `deliver()` — every caller and flow stays unchanged.
 */

export interface AuthEmail {
  to: string;
  subject: string;
  /** The primary action URL (verification / reset link). */
  actionUrl: string;
  body: string;
}

/** Absolute URL for an auth action, built on the single site-origin source of truth. */
export function authActionUrl(path: string, token: string): string {
  const base = resolveSiteUrl().replace(/\/$/, '');
  const qs = new URLSearchParams({ token }).toString();
  return `${base}${path}?${qs}`;
}

async function deliver(email: AuthEmail): Promise<void> {
  // INTEGRATION SEAM — plug an email provider here (see EMAIL_FROM in .env.example).
  // Until then, log the link so verification/reset can be tested locally.
  console.info(
    `[auth/email] (no provider configured) → ${email.to}: ${email.subject}\n  ${email.actionUrl}`,
  );
}

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const actionUrl = authActionUrl('/api/auth/verify-email', token);
  await deliver({
    to,
    subject: 'Verify your email',
    actionUrl,
    body: `Confirm your email address by visiting: ${actionUrl}`,
  });
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const actionUrl = authActionUrl('/api/auth/reset-password', token);
  await deliver({
    to,
    subject: 'Reset your password',
    actionUrl,
    body: `Reset your password by visiting: ${actionUrl}`,
  });
}
