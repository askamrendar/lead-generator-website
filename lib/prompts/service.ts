import { prisma } from '@/lib/db/prisma';
import { requireUser } from '@/lib/auth/session';

/**
 * AI Prompt Library service (Phase 9). User-scoped prompt templates + AI run history.
 * Every call resolves the current user via requireUser() and scopes by userId — there
 * is no cross-user access. Prompts are reusable across the AI Generator / Blog modules.
 */

export interface PromptDTO {
  id: string;
  title: string;
  body: string;
  category: string;
  favorite: boolean;
  builtIn: boolean;
  useCount: number;
  updatedAt: string;
}

function toDTO(p: {
  id: string; title: string; body: string; category: string;
  favorite: boolean; builtIn: boolean; useCount: number; updatedAt: Date;
}): PromptDTO {
  return {
    id: p.id, title: p.title, body: p.body, category: p.category,
    favorite: p.favorite, builtIn: p.builtIn, useCount: p.useCount,
    updatedAt: p.updatedAt.toISOString(),
  };
}

/** Starter templates seeded on first visit so the library is never empty. */
const STARTER_PROMPTS: Array<{ title: string; body: string; category: string }> = [
  { title: 'Local service homepage', category: 'website', body: 'Write a homepage hero + services overview for a {industry} business in {city} that emphasizes fast response, licensing, and trust.' },
  { title: 'Service area page', category: 'website', body: 'Generate a service-area landing page for {service} in {city}, {state} with local proof points and a strong CTA.' },
  { title: 'FAQ block', category: 'content', body: 'Produce 6 concise FAQs for a {industry} company covering pricing, scheduling, warranty, and emergencies.' },
  { title: 'Blog: how-to guide', category: 'blog', body: 'Write an SEO how-to article about {topic} for homeowners, ~800 words, with an intro, steps, and a closing CTA.' },
  { title: 'Google Business post', category: 'content', body: 'Draft a short Google Business Profile update announcing {offer} for a {industry} business, friendly and local.' },
];

/** Ensure the user's starter prompts exist (idempotent). Returns nothing. */
export async function ensureStarterPrompts(userId: string): Promise<void> {
  const count = await prisma.prompt.count({ where: { userId } });
  if (count > 0) return;
  await prisma.prompt.createMany({
    data: STARTER_PROMPTS.map((p) => ({ ...p, userId, builtIn: true })),
  });
}

export async function listPrompts(): Promise<PromptDTO[]> {
  const user = await requireUser();
  await ensureStarterPrompts(user.id);
  const rows = await prisma.prompt.findMany({
    where: { userId: user.id },
    orderBy: [{ favorite: 'desc' }, { updatedAt: 'desc' }],
  });
  return rows.map(toDTO);
}

export async function createPrompt(input: { title: string; body: string; category?: string }): Promise<{ id: string }> {
  const user = await requireUser();
  const p = await prisma.prompt.create({
    data: { userId: user.id, title: input.title, body: input.body, category: input.category ?? 'general' },
    select: { id: true },
  });
  return { id: p.id };
}

export async function updatePrompt(id: string, patch: { title?: string; body?: string; category?: string; favorite?: boolean }): Promise<void> {
  const user = await requireUser();
  // Scope by userId so a user can't edit another's prompt.
  await prisma.prompt.updateMany({ where: { id, userId: user.id }, data: patch });
}

export async function deletePrompt(id: string): Promise<void> {
  const user = await requireUser();
  await prisma.prompt.deleteMany({ where: { id, userId: user.id } });
}

/** Mark a prompt used (increments useCount) — call when a prompt is applied. */
export async function markPromptUsed(id: string): Promise<void> {
  const user = await requireUser();
  await prisma.prompt.updateMany({ where: { id, userId: user.id }, data: { useCount: { increment: 1 } } });
}

// ----- AI run history ------------------------------------------------------

export interface AiRunDTO {
  id: string;
  kind: string;
  prompt: string;
  output: string | null;
  websiteId: string | null;
  createdAt: string;
}

/** Record an AI run for history (bounded output preview). */
export async function recordAiRun(input: { kind: string; prompt: string; output?: string; websiteId?: string }): Promise<void> {
  const user = await requireUser();
  await prisma.aiRun.create({
    data: {
      userId: user.id,
      kind: input.kind,
      prompt: input.prompt.slice(0, 2000),
      output: input.output?.slice(0, 4000),
      websiteId: input.websiteId,
    },
  });
}

export async function listAiRuns(limit = 50): Promise<AiRunDTO[]> {
  const user = await requireUser();
  const rows = await prisma.aiRun.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return rows.map((r) => ({
    id: r.id, kind: r.kind, prompt: r.prompt, output: r.output,
    websiteId: r.websiteId, createdAt: r.createdAt.toISOString(),
  }));
}
