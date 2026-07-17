import { prisma } from '@/lib/db/prisma';
import { requireWorkspaceAccess } from '@/lib/auth/access';
import { encryptSecret, decryptSecret } from '@/lib/security/secrets';
import { getProviderByName } from '@/lib/ai/providers';
import { withAiCredentials, type AiCredentials } from '@/lib/ai/credentials-context';
import type { ProviderName } from '@/lib/ai/types';

/**
 * Workspace AI credentials (BYO API keys) — Settings → AI Providers.
 *
 * Storage: `WorkspaceSettings.metadata.aiCredentials` (existing open-JSON column —
 * no migration). The API key is encrypted at rest via `lib/security/secrets`
 * (AES-256-GCM under SECRET_ENCRYPTION_KEY; dev passthrough).
 *
 * Resolution order (see credentials-context): workspace key → env key → mock.
 * Session-guarded functions for the dashboard; `*Core` reads for job handlers
 * (jobs run as SYSTEM — the enqueue site is the authorization point).
 */

const PROVIDERS: ProviderName[] = ['openai', 'anthropic', 'gemini', 'openrouter'];

export interface AiCredentialInfo {
  provider: ProviderName | null;
  model: string | null;
  /** Masked key for display, e.g. "sk-…4f2a". Never the real key. */
  maskedKey: string | null;
  configured: boolean;
  updatedAt: string | null;
}

interface StoredCreds {
  provider: ProviderName;
  apiKey: string; // encrypted at rest
  model?: string;
  updatedAt?: string;
}

/**
 * Sanitize a pasted API key: strip ALL whitespace (incl. line-wraps from
 * terminals/emails) and invisible Unicode (zero-width spaces, BOM, NBSP,
 * directional marks) that ride along with copy-paste. Real API keys never
 * contain any of these — a stray one produces confusing provider 401s like
 * OpenRouter's "Missing Authentication header".
 */
export function sanitizeApiKey(raw: string): string {
  let key = raw
    // Quotes copied from .env files / JSON snippets.
    .replace(/["'`]/g, '')
    // A pasted "Bearer <key>" or "Authorization: Bearer <key>" line.
    .replace(/^\s*(authorization\s*:)?\s*bearer\s+/i, '');
  // Strip whitespace + invisible Unicode (zero-width, BOM, NBSP, direction marks).
  key = key.replace(/[\s\u0000-\u001f\u007f\u00a0\u200b-\u200f\u2028\u2029\ufeff]/g, '');
  return key;
}

function mask(key: string): string {
  if (key.length <= 8) return '••••';
  return `${key.slice(0, 3)}…${key.slice(-4)}`;
}

async function readStored(workspaceId: string): Promise<StoredCreds | null> {
  const settings = await prisma.workspaceSettings.findUnique({
    where: { workspaceId },
    select: { metadata: true },
  });
  const meta = (settings?.metadata ?? {}) as Record<string, unknown>;
  const raw = meta.aiCredentials as StoredCreds | undefined;
  if (!raw || !raw.provider || !raw.apiKey) return null;
  if (!PROVIDERS.includes(raw.provider)) return null;
  return raw;
}

/** SYSTEM-level: decrypted credentials for a workspace (null when unset). */
export async function aiCredentialsForWorkspaceCore(
  workspaceId: string,
): Promise<AiCredentials | null> {
  const stored = await readStored(workspaceId);
  if (!stored) return null;
  try {
    return {
      provider: stored.provider,
      apiKey: decryptSecret(stored.apiKey),
      model: stored.model || undefined,
    };
  } catch {
    // Missing/rotated SECRET_ENCRYPTION_KEY — treat as unconfigured, never crash generation.
    return null;
  }
}

/** SYSTEM-level: resolve a website's workspace credentials (for job handlers). */
export async function aiCredentialsForWebsiteCore(
  websiteId: string,
): Promise<AiCredentials | null> {
  const w = await prisma.website.findUnique({
    where: { id: websiteId },
    select: { project: { select: { workspaceId: true } } },
  });
  if (!w) return null;
  return aiCredentialsForWorkspaceCore(w.project.workspaceId);
}

/** Run `fn` under a website's workspace AI credentials (env fallback inside). */
export async function withWebsiteAiCredentials<T>(
  websiteId: string,
  fn: () => Promise<T>,
): Promise<T> {
  const creds = await aiCredentialsForWebsiteCore(websiteId);
  return withAiCredentials(creds, fn);
}

/** Session-guarded: display info for the settings page (masked, never the key). */
export async function getAiCredentialInfo(workspaceId: string): Promise<AiCredentialInfo> {
  await requireWorkspaceAccess(workspaceId, 'workspace:view');
  const stored = await readStored(workspaceId);
  if (!stored) {
    return { provider: null, model: null, maskedKey: null, configured: false, updatedAt: null };
  }
  let masked = '••••';
  try {
    masked = mask(decryptSecret(stored.apiKey));
  } catch {
    /* key unreadable under current SECRET_ENCRYPTION_KEY — still show configured */
  }
  return {
    provider: stored.provider,
    model: stored.model ?? null,
    maskedKey: masked,
    configured: true,
    updatedAt: stored.updatedAt ?? null,
  };
}

/** Session-guarded: save (or replace) the workspace's AI provider + key. */
export async function saveAiCredentials(
  workspaceId: string,
  input: { provider: ProviderName; apiKey: string; model?: string },
): Promise<void> {
  await requireWorkspaceAccess(workspaceId, 'workspace:update');
  if (!PROVIDERS.includes(input.provider)) throw new Error('Unknown provider.');
  const apiKey = sanitizeApiKey(input.apiKey);
  if (apiKey.length < 8) throw new Error('Enter a valid API key.');

  const stored: StoredCreds = {
    provider: input.provider,
    apiKey: encryptSecret(apiKey),
    model: input.model?.trim() || undefined,
    updatedAt: new Date().toISOString(),
  };

  const existing = await prisma.workspaceSettings.findUnique({
    where: { workspaceId },
    select: { metadata: true },
  });
  const meta = { ...((existing?.metadata ?? {}) as Record<string, unknown>), aiCredentials: stored };
  await prisma.workspaceSettings.upsert({
    where: { workspaceId },
    create: { workspaceId, metadata: meta as unknown as object },
    update: { metadata: meta as unknown as object },
  });
}

/** Session-guarded: remove the stored key (falls back to env/deterministic). */
export async function clearAiCredentials(workspaceId: string): Promise<void> {
  await requireWorkspaceAccess(workspaceId, 'workspace:update');
  const existing = await prisma.workspaceSettings.findUnique({
    where: { workspaceId },
    select: { metadata: true },
  });
  if (!existing) return;
  const meta = { ...((existing.metadata ?? {}) as Record<string, unknown>) };
  delete meta.aiCredentials;
  await prisma.workspaceSettings.update({
    where: { workspaceId },
    data: { metadata: meta as unknown as object },
  });
}

/**
 * Session-guarded: live-test a key by making a tiny real completion. Returns a
 * human-readable result; never throws. Tests the CANDIDATE key (not the stored one).
 */
export async function testAiCredentials(
  workspaceId: string,
  input: { provider: ProviderName; apiKey: string; model?: string },
): Promise<{ ok: boolean; message: string }> {
  await requireWorkspaceAccess(workspaceId, 'workspace:view');
  if (!PROVIDERS.includes(input.provider)) return { ok: false, message: 'Unknown provider.' };
  try {
    const result = await withAiCredentials(
      { provider: input.provider, apiKey: sanitizeApiKey(input.apiKey), model: input.model?.trim() || undefined },
      () =>
        getProviderByName(input.provider).complete({
          prompt: 'Reply with the single word: ok',
          maxTokens: 8,
          temperature: 0,
        }),
    );
    return {
      ok: true,
      message: `Connected — ${input.provider} responded (model ${result.model}).`,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Connection failed.';
    // Trim provider error bodies to a single readable line, and translate the
    // common auth failures into actionable guidance.
    const line = msg.split('\n')[0]!.slice(0, 300);
    if (/401|unauthorized|invalid.*key|authentication/i.test(line)) {
      return {
        ok: false,
        message: `${line} — check that the key was copied completely (no spaces or line breaks) and is active on the provider's dashboard.`,
      };
    }
    return { ok: false, message: line };
  }
}
