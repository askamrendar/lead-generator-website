import { getWebsite } from '@/lib/websites/service';
import { jobsForWebsite } from '@/lib/jobs/service';
import { AiGenerator } from '@/components/websites/AiGenerator';
import { isAIEnabled, getAIConfig } from '@/lib/ai/config';
import { businessFromWizard } from '@/lib/websites/render-service';
import { buildHomeContext } from '@/lib/ai/context';
import { buildImagePrompts } from '@/lib/ai/services/image-prompts';

/**
 * Website AI Generator tab (Task 1). Wires the dashboard into the existing generation
 * engines via `lib/websites/generate-service` (run asynchronously through the Phase 8.5
 * queue). Read path is tenant-access-guarded by `getWebsite`. Also surfaces the
 * honest AI-mode banner (offline vs live provider) and the per-website image-prompt
 * pack (M6/M7) — both derived from existing engines, no new generation logic.
 */
export default async function WebsiteAiGeneratorPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = await params;
  const website = await getWebsite(websiteId); // enforces access
  const jobRows = await jobsForWebsite(websiteId, 'website.generate');

  const jobs = jobRows.map((j) => ({
    id: j.id,
    status: j.status,
    attempts: j.attempts,
    maxAttempts: j.maxAttempts,
    error: j.error,
    createdAt: j.createdAt,
  }));

  // Per-website image prompts from the existing image-prompt engine (M7).
  const business = businessFromWizard(website.businessConfig);
  const imagePrompts = business
    ? buildImagePrompts(buildHomeContext(business)).map((p) => ({
        slot: p.slot,
        aspect: p.aspect ?? '1:1',
        prompt: p.prompt,
        alt: p.alt,
      }))
    : [];

  return (
    <AiGenerator
      websiteId={websiteId}
      status={website.status}
      jobs={jobs}
      workerConfigured={Boolean(process.env.JOBS_WORKER_TOKEN)}
      aiEnabled={isAIEnabled()}
      aiProvider={getAIConfig().provider}
      imagePrompts={imagePrompts}
    />
  );
}
