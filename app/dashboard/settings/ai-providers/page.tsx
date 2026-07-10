import { Sparkles } from 'lucide-react';
import { Panel } from '@/components/ui/panel';
import { InfoList } from '@/components/dashboard/InfoList';

export default function AiProvidersSettingsPage() {
  return (
    <Panel title="AI Providers" description="Configure the model provider used for content generation.">
      <p className="mb-3 text-sm text-muted-fg">
        The AI engine is provider-agnostic (OpenAI · Anthropic · Gemini · OpenRouter) and is
        currently selected via environment variables. A UI to manage keys per workspace arrives
        with the AI Generator (Phase 7.2.4).
      </p>
      <InfoList
        items={[
          ['Supported providers', 'OpenAI, Anthropic, Gemini, OpenRouter'],
          ['Offline fallback', 'Deterministic content engine'],
          ['Configuration', 'Environment (per-workspace UI: Phase 7.2.4)'],
        ]}
      />
      <p className="mt-3 flex items-center gap-2 text-xs text-muted-fg">
        <Sparkles className="size-3.5" aria-hidden />
        No keys are exposed here.
      </p>
    </Panel>
  );
}
