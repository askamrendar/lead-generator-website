'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, CheckCircle2, AlertTriangle, Trash2, PlugZap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FormField } from '@/components/auth/FormField';
import { LoadingButton } from '@/components/auth/LoadingButton';
import { useToast } from '@/components/ui/toast';
import {
  saveAiCredentialsAction,
  clearAiCredentialsAction,
  testAiCredentialsAction,
} from '@/app/dashboard/settings/ai-providers/actions';

/**
 * Settings → AI Providers form: pick a provider, paste an API key, optionally
 * override the model, live-test the connection, save (encrypted at rest).
 * The saved key powers AI website/blog generation for every website in the
 * workspace; without one the engine runs in deterministic offline mode.
 */

const PROVIDERS = [
  { key: 'openai', label: 'OpenAI', placeholder: 'sk-…', defaultModel: 'gpt-4o-mini', keysUrl: 'https://platform.openai.com/api-keys' },
  { key: 'anthropic', label: 'Anthropic', placeholder: 'sk-ant-…', defaultModel: 'claude-3-5-haiku-latest', keysUrl: 'https://console.anthropic.com/settings/keys' },
  { key: 'gemini', label: 'Google Gemini', placeholder: 'AIza…', defaultModel: 'gemini-2.0-flash', keysUrl: 'https://aistudio.google.com/apikey' },
  { key: 'openrouter', label: 'OpenRouter', placeholder: 'sk-or-…', defaultModel: 'openai/gpt-4o-mini', keysUrl: 'https://openrouter.ai/keys' },
] as const;

export interface AiProviderFormProps {
  workspaceId: string;
  configured: boolean;
  currentProvider: string | null;
  currentModel: string | null;
  maskedKey: string | null;
  envConfigured: boolean;
  envProvider: string | null;
}

export function AiProviderForm({
  workspaceId,
  configured,
  currentProvider,
  currentModel,
  maskedKey,
  envConfigured,
  envProvider,
}: AiProviderFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [provider, setProvider] = React.useState(currentProvider ?? 'openai');
  const [apiKey, setApiKey] = React.useState('');
  const [model, setModel] = React.useState(currentModel ?? '');
  const [testResult, setTestResult] = React.useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = React.useTransition();
  const [testing, startTesting] = React.useTransition();

  const meta = PROVIDERS.find((p) => p.key === provider) ?? PROVIDERS[0];

  function test() {
    if (apiKey.trim().length < 8) {
      setTestResult({ ok: false, message: 'Paste an API key first.' });
      return;
    }
    startTesting(async () => {
      const res = await testAiCredentialsAction(workspaceId, { provider, apiKey, model: model || undefined });
      setTestResult(res);
    });
  }

  function save() {
    if (apiKey.trim().length < 8) {
      toast({ variant: 'error', title: 'Enter a valid API key' });
      return;
    }
    startTransition(async () => {
      const res = await saveAiCredentialsAction(workspaceId, { provider, apiKey, model: model || undefined });
      if (res.ok) {
        toast({ variant: 'success', title: 'AI provider connected', description: 'Generation now uses your key for this workspace.' });
        setApiKey('');
        setTestResult(null);
        router.refresh();
      } else {
        toast({ variant: 'error', title: 'Could not save', description: res.error });
      }
    });
  }

  function remove() {
    startTransition(async () => {
      const res = await clearAiCredentialsAction(workspaceId);
      if (res.ok) {
        toast({ variant: 'success', title: 'AI provider disconnected' });
        router.refresh();
      } else {
        toast({ variant: 'error', title: 'Could not remove', description: res.error });
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Current status */}
      {configured ? (
        <Card className="flex items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="size-5 text-brand" aria-hidden />
            <div>
              <p className="text-sm font-medium text-foreground">
                Connected: {PROVIDERS.find((p) => p.key === currentProvider)?.label ?? currentProvider}
              </p>
              <p className="text-xs text-muted-fg">
                Key {maskedKey}
                {currentModel ? <> · model <code className="rounded bg-muted px-1">{currentModel}</code></> : null}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" disabled={pending} onClick={remove}>
            <Trash2 aria-hidden /> Disconnect
          </Button>
        </Card>
      ) : envConfigured ? (
        <Card className="flex items-start gap-3 p-4">
          <Sparkles className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
          <p className="text-sm text-muted-fg">
            Using the server&apos;s <code className="rounded bg-muted px-1">{envProvider}</code> key
            (set by the administrator). Add a workspace key below to use your own.
          </p>
        </Card>
      ) : (
        <Card className="flex items-start gap-3 border-amber-500/30 p-4">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden />
          <p className="text-sm text-muted-fg">
            <span className="font-medium text-foreground">No AI provider connected.</span>{' '}
            Websites generate with built-in deterministic copy until you connect one — connect a
            provider to get unique, AI-written content and images.
          </p>
        </Card>
      )}

      {/* Provider picker */}
      <div className="grid gap-3 sm:grid-cols-4">
        {PROVIDERS.map((p) => {
          const active = provider === p.key;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => { setProvider(p.key); setTestResult(null); }}
              aria-pressed={active}
              className={
                'rounded-lg border p-3 text-left text-sm font-medium transition-colors ' +
                (active ? 'border-brand bg-brand/5 text-foreground' : 'border-border text-muted-fg hover:bg-muted')
              }
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <FormField
        id="ai-key"
        label={`${meta.label} API key`}
        hint={`Get one at ${meta.keysUrl} — stored encrypted, never shown again.`}
        required
      >
        <Input
          id="ai-key"
          type="password"
          value={apiKey}
          onChange={(e) => { setApiKey(e.target.value); setTestResult(null); }}
          placeholder={meta.placeholder}
          autoComplete="off"
        />
      </FormField>

      <FormField id="ai-model" label="Model" hint={`Optional — defaults to ${meta.defaultModel}.`}>
        <Input
          id="ai-model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder={meta.defaultModel}
        />
      </FormField>

      {testResult ? (
        <p
          role="status"
          className={
            'flex items-start gap-2 rounded-md border p-3 text-sm ' +
            (testResult.ok
              ? 'border-brand/30 bg-brand/5 text-foreground'
              : 'border-red-500/30 bg-red-500/5 text-red-600 dark:text-red-400')
          }
        >
          {testResult.ok ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
          ) : (
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          )}
          {testResult.message}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" disabled={testing || pending} onClick={test}>
          <PlugZap aria-hidden /> {testing ? 'Testing…' : 'Test connection'}
        </Button>
        <LoadingButton loading={pending} loadingText="Saving…" onClick={save}>
          Save & connect
        </LoadingButton>
        {configured ? <Badge variant="brand">Active</Badge> : null}
      </div>
    </div>
  );
}
