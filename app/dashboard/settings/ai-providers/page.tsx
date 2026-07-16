import { loadDashboardContext } from '@/lib/dashboard/context';
import { getAiCredentialInfo } from '@/lib/ai/credentials';
import { getAIConfig } from '@/lib/ai/config';
import { Panel } from '@/components/ui/panel';
import { AiProviderForm } from '@/components/dashboard/AiProviderForm';

/**
 * Settings → AI Providers: connect a BYO API key (OpenAI / Anthropic / Gemini /
 * OpenRouter) for this workspace. The key is encrypted at rest and used by the
 * AI website generator, blog generator, and image generation for every website
 * in the workspace. Falls back to server env keys, then deterministic mode.
 */
export default async function AiProvidersSettingsPage() {
  const ctx = await loadDashboardContext();
  const ws = ctx?.currentWorkspace;
  if (!ws) {
    return (
      <Panel title="AI Providers" description="Connect an AI provider to generate unique content.">
        <p className="text-sm text-muted-fg">No workspace selected.</p>
      </Panel>
    );
  }

  const info = await getAiCredentialInfo(ws.id);
  const envConfig = getAIConfig();

  return (
    <Panel
      title="AI Providers"
      description="Connect your AI provider — it powers website generation, blog content, and images for this workspace."
    >
      <AiProviderForm
        workspaceId={ws.id}
        configured={info.configured}
        currentProvider={info.provider}
        currentModel={info.model}
        maskedKey={info.maskedKey}
        envConfigured={envConfig.enabled}
        envProvider={envConfig.enabled ? envConfig.provider : null}
      />
    </Panel>
  );
}
