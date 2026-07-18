import { randomBytes } from 'node:crypto';

/**
 * Pure DNS helpers for the Domain Manager — hostname validation, verification-token
 * generation, and the expected DNS records a user must add. No network (that lives in
 * `verify.ts`), so this is unit-testable (tests/domains-dns.test.mjs).
 */

export interface DnsRecord {
  type: 'A' | 'CNAME' | 'TXT';
  name: string;
  value: string;
  note?: string;
}

const HOSTNAME_RE =
  /^(?=.{1,253}$)(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/;

/** Basic hostname validation (apex or subdomain, lowercase, valid labels). */
export function isValidHostname(hostname: string): boolean {
  return HOSTNAME_RE.test(hostname.trim().toLowerCase());
}

/** Is this a subdomain (3+ labels), e.g. app.example.com? */
export function isSubdomain(hostname: string): boolean {
  return hostname.split('.').filter(Boolean).length > 2;
}

/** The registrable apex for a hostname (naïve last-two-labels; good enough for UX). */
export function apexOf(hostname: string): string {
  const parts = hostname.toLowerCase().split('.').filter(Boolean);
  return parts.slice(-2).join('.');
}

/** Single-use verification token (raw). */
export function makeVerificationToken(): string {
  return `lsp-verify-${randomBytes(16).toString('hex')}`;
}

/**
 * The DNS records the user must create to verify + point a domain at the platform.
 * `appHost` is the REAL host serving this app (custom-domain requests must reach it
 * so the Host-header rewrite can route them) — callers pass it from the deployment
 * env (lib/domains/service resolves it via lib/site). Cloudflare-friendly: CNAME
 * everywhere (Cloudflare flattens CNAME at the apex), no hardcoded IPs — pointing
 * an A record at a platform IP breaks whenever the host's IP changes.
 */
export function expectedRecords(hostname: string, token: string, appHost: string): DnsRecord[] {
  const host = hostname.trim().toLowerCase();
  const records: DnsRecord[] = [
    { type: 'TXT', name: `_lsp-verify.${apexOf(host)}`, value: token, note: 'Ownership verification' },
  ];
  if (isSubdomain(host)) {
    records.push({ type: 'CNAME', name: host, value: appHost, note: 'Points the subdomain to the platform' });
  } else {
    records.push({
      type: 'CNAME',
      name: host,
      value: appHost,
      note: 'Apex — use Cloudflare (flattens CNAME at root) or your DNS host’s ALIAS/ANAME record',
    });
    records.push({ type: 'CNAME', name: `www.${host}`, value: appHost, note: 'www subdomain' });
  }
  return records;
}

/** The FQDN a TXT verification lookup should target. */
export function verifyRecordName(hostname: string): string {
  return `_lsp-verify.${apexOf(hostname.trim().toLowerCase())}`;
}
