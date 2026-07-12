'use client';

import * as React from 'react';
import { Sparkles, Star, Trash2, Plus, Copy, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/ui/empty-state';
import {
  createPromptAction,
  updatePromptAction,
  deletePromptAction,
  markPromptUsedAction,
} from '@/app/dashboard/prompts/actions';
import type { PromptDTO } from '@/lib/prompts/service';

/** AI Prompt Library UI — create, favorite, copy, and delete reusable prompts. */
export function PromptLibrary({ prompts }: { prompts: PromptDTO[] }) {
  const [pending, startTransition] = React.useTransition();
  const [title, setTitle] = React.useState('');
  const [body, setBody] = React.useState('');
  const [category, setCategory] = React.useState('general');
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  function create() {
    if (!title.trim() || !body.trim()) return;
    startTransition(async () => {
      await createPromptAction({ title, body, category });
      setTitle('');
      setBody('');
    });
  }

  async function copy(p: PromptDTO) {
    try {
      await navigator.clipboard.writeText(p.body);
      setCopiedId(p.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      /* clipboard unavailable */
    }
    startTransition(() => markPromptUsedAction(p.id).then(() => undefined));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="p-5 lg:col-span-1">
        <h2 className="text-sm font-semibold text-foreground">New prompt</h2>
        <div className="mt-3 space-y-3">
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Prompt title" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Category"
            className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm"
          >
            {['general', 'website', 'blog', 'content'].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <Textarea
            placeholder="Prompt body — use {placeholders} like {city}, {industry}, {service}…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            aria-label="Prompt body"
          />
          <Button size="sm" disabled={pending || !title.trim() || !body.trim()} onClick={create}>
            <Plus aria-hidden /> Add prompt
          </Button>
        </div>
      </Card>

      <div className="space-y-3 lg:col-span-2">
        {prompts.length === 0 ? (
          <EmptyState icon={Sparkles} title="No prompts yet" description="Save reusable AI prompts to speed up generation." />
        ) : (
          prompts.map((p) => (
            <Card key={p.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-foreground">{p.title}</p>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-fg">{p.category}</span>
                    {p.builtIn && <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-fg">starter</span>}
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-fg">{p.body}</p>
                  {p.useCount > 0 && <p className="mt-1 text-[11px] text-muted-fg">Used {p.useCount}×</p>}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    aria-label={p.favorite ? 'Unfavorite' : 'Favorite'}
                    aria-pressed={p.favorite}
                    disabled={pending}
                    onClick={() => startTransition(() => updatePromptAction(p.id, { favorite: !p.favorite }).then(() => undefined))}
                    className="rounded-md p-1.5 text-muted-fg hover:bg-muted hover:text-foreground"
                  >
                    <Star className={`size-4 ${p.favorite ? 'fill-amber-400 text-amber-500' : ''}`} aria-hidden />
                  </button>
                  <button
                    type="button"
                    aria-label="Copy prompt"
                    disabled={pending}
                    onClick={() => copy(p)}
                    className="rounded-md p-1.5 text-muted-fg hover:bg-muted hover:text-foreground"
                  >
                    {copiedId === p.id ? <Check className="size-4 text-emerald-600" aria-hidden /> : <Copy className="size-4" aria-hidden />}
                  </button>
                  {!p.builtIn && (
                    <button
                      type="button"
                      aria-label="Delete prompt"
                      disabled={pending}
                      onClick={() => startTransition(() => deletePromptAction(p.id).then(() => undefined))}
                      className="rounded-md p-1.5 text-muted-fg hover:bg-muted hover:text-foreground"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
