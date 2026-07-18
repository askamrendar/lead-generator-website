import type { GeneratedPageContent } from '@/lib/ai/types';

/**
 * Long-form article body shared by every pack's home/service/area pages —
 * moved verbatim from lib/htmlgen/engine.ts so packs and engine share ONE
 * implementation. Content values come from the AI/deterministic engine and
 * are trusted HTML-safe plain strings (same contract as before).
 */
export function articleHtml(c: GeneratedPageContent, heading: string): string {
  const process = c.process
    .map((p) => `<li><strong>${p.title}</strong> – ${p.description}</li>`)
    .join('');
  const benefits = c.benefits.map((b) => `<li>${b}</li>`).join('');
  const why = c.whyChooseUs.map((w) => `<p>✔ <strong>${w}</strong></p>`).join('');
  return [
    `<h2>${heading}</h2>`,
    `<p>${c.intro}</p>`,
    process ? `<h2>Our Process</h2><ol>${process}</ol>` : '',
    benefits ? `<h2>Why It Matters</h2><ul>${benefits}</ul>` : '',
    why ? `<h2>Why Choose Us?</h2>${why}` : '',
  ].join('');
}
