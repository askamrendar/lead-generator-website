import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

/**
 * Secret encryption at rest (AES-256-GCM, node:crypto — no native dep).
 *
 * Threat model: protect stored provider credentials (BYO API keys living in
 * `Website.deploymentConfig.envVars`) against a database dump / backup leak. Values are
 * encrypted with a key derived (scrypt) from `SECRET_ENCRYPTION_KEY` and stored as an
 * opaque `enc:v1:<iv>:<tag>:<ciphertext>` token.
 *
 * Design contract (offline-first / dev-safe, mirrors `lib/env.ts`):
 *   - No key configured  → `encryptSecret` passes the value through UNCHANGED (dev), and
 *     `decryptSecret` returns any plaintext (non-`enc:` token) unchanged. The app keeps
 *     working locally; production is nudged to set the key via `validateEnv()`.
 *   - Key configured     → new writes are encrypted; reads transparently decrypt.
 *   - Idempotent: `encryptSecret` never re-encrypts an already-`enc:` token; `decryptSecret`
 *     never touches legacy plaintext. So config can round-trip (read → edit → write) safely.
 *
 * The `*WithKey` core functions are pure (given raw key material) so the roundtrip is
 * unit-testable without touching the environment. Reads `process.env` directly (not
 * `@/lib/env`) so the Node test loader can import this module via a relative `.ts` path.
 */

const PREFIX = 'enc:v1:';
const KEY_SALT = 'lead-generator-website::secret::v1';

/** Derive a 32-byte AES key from an arbitrary-length passphrase. */
export function deriveKey(secret: string): Buffer {
  return scryptSync(secret, KEY_SALT, 32);
}

/** True if a stored value is an encrypted token this module produced. */
export function isEncrypted(value: string): boolean {
  return typeof value === 'string' && value.startsWith(PREFIX);
}

/** Encrypt a plaintext string with explicit key material. Pure. */
export function encryptWithKey(plaintext: string, key: Buffer): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString('base64')}:${tag.toString('base64')}:${ct.toString('base64')}`;
}

/** Decrypt an `enc:v1:` token with explicit key material. Pure. Throws on tamper/wrong key. */
export function decryptWithKey(token: string, key: Buffer): string {
  if (!isEncrypted(token)) return token;
  const [, , ivB64, tagB64, ctB64] = token.split(':');
  if (!ivB64 || !tagB64 || !ctB64) throw new Error('Malformed encrypted secret token.');
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(ctB64, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}

function envKey(): Buffer | null {
  const secret = process.env.SECRET_ENCRYPTION_KEY;
  if (!secret || secret.length === 0) return null;
  return deriveKey(secret);
}

/**
 * Encrypt a single secret using the configured key. No key → passthrough (dev). Already
 * encrypted → returned unchanged (idempotent). Empty string → unchanged (nothing to hide).
 *
 * Fail-closed in production: storing a real secret without a key would silently defeat
 * at-rest protection precisely when it matters (a DB/backup leak), so we throw instead.
 */
export function encryptSecret(plaintext: string): string {
  if (!plaintext || isEncrypted(plaintext)) return plaintext;
  const key = envKey();
  if (!key) {
    if ((process.env.NODE_ENV ?? 'development') === 'production') {
      throw new Error(
        'Refusing to store a provider secret without SECRET_ENCRYPTION_KEY in production. Set the key to enable encryption at rest.',
      );
    }
    return plaintext; // dev/test: passthrough keeps the offline-first flow working
  }
  return encryptWithKey(plaintext, key);
}

/**
 * Decrypt a single stored value. Plaintext (legacy / dev) is returned as-is. An `enc:`
 * token requires the key; if the key is missing or wrong we fail closed (throw) rather
 * than leak or silently return ciphertext.
 */
export function decryptSecret(value: string): string {
  if (!isEncrypted(value)) return value;
  const key = envKey();
  if (!key) {
    throw new Error(
      'Encountered an encrypted secret but SECRET_ENCRYPTION_KEY is not set. Configure the key used to encrypt it.',
    );
  }
  return decryptWithKey(value, key);
}

/** Encrypt every value in a string map (for writing a credentials record). */
export function encryptSecretMap(
  record: Record<string, string> | undefined,
): Record<string, string> | undefined {
  if (!record) return record;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(record)) out[k] = encryptSecret(v);
  return out;
}

/** Decrypt every value in a string map (for reading a credentials record). */
export function decryptSecretMap(
  record: Record<string, string> | undefined,
): Record<string, string> | undefined {
  if (!record) return record;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(record)) out[k] = decryptSecret(v);
  return out;
}
