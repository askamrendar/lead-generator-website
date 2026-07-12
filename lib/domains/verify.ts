import { resolveTxt } from 'node:dns/promises';
import { verifyRecordName } from '@/lib/domains/dns';

/**
 * Runtime DNS verification — checks whether the ownership TXT record has propagated.
 * Node-only (uses `node:dns`); called at request time, never at build. Returns a
 * structured result; a lookup failure (NXDOMAIN / no propagation yet) is not an error,
 * just `verified: false`.
 */
export async function checkTxtVerification(
  hostname: string,
  token: string,
): Promise<{ verified: boolean; found: string[]; message: string }> {
  const name = verifyRecordName(hostname);
  try {
    const records = await resolveTxt(name);
    const found = records.map((chunks) => chunks.join(''));
    const verified = found.includes(token);
    return {
      verified,
      found,
      message: verified
        ? 'Verification TXT record found.'
        : `TXT record at ${name} did not match — DNS may still be propagating.`,
    };
  } catch {
    return {
      verified: false,
      found: [],
      message: `No TXT record at ${name} yet — add it and allow time to propagate.`,
    };
  }
}
