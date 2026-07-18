'use client';

import * as React from 'react';
import {
  ArrowLeft,
  Eye,
  FileText,
  Home,
  Loader2,
  MapPin,
  Plus,
  RotateCcw,
  Trash2,
  Wrench,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { savePageOverrideAction } from '@/app/editor/[websiteId]/actions';
import type { EditorData, EditorPage } from '@/lib/websites/editor-service';
import type { PageOverride } from '@/lib/websites/content-overrides';

/**
 * Full-page Site Editor: left sidebar lists EVERY page of the generated site
 * (core / services / areas — all derived from the user's data), right pane is
 * a content form for the selected page. Saving stores a per-page override
 * patch; empty fields fall back to the AI/deterministic copy. CMS-style UX —
 * no canvas, no blocks — because the served site is template-pack HTML.
 */

type ListItem = { question: string; answer: string };

interface FormState {
  seoTitle: string;
  metaDescription: string;
  heroHeading: string;
  heroCopy: string;
  intro: string;
  benefits: string[];
  whyChooseUs: string[];
  faqs: ListItem[];
  ctaTitle: string;
  ctaDescription: string;
}

/** Build the form's initial state: override value if saved, else '' (placeholder shows generated copy). */
function initialForm(page: EditorPage): FormState {
  const o = page.override ?? {};
  return {
    seoTitle: o.seoTitle ?? '',
    metaDescription: o.metaDescription ?? '',
    heroHeading: o.heroHeading ?? '',
    heroCopy: o.heroCopy ?? '',
    intro: o.intro ?? '',
    benefits: o.benefits ?? [],
    whyChooseUs: o.whyChooseUs ?? [],
    faqs: o.faqs ?? [],
    ctaTitle: o.cta?.title ?? '',
    ctaDescription: o.cta?.description ?? '',
  };
}

function toPatch(f: FormState): PageOverride {
  const patch: PageOverride = {};
  if (f.seoTitle.trim()) patch.seoTitle = f.seoTitle;
  if (f.metaDescription.trim()) patch.metaDescription = f.metaDescription;
  if (f.heroHeading.trim()) patch.heroHeading = f.heroHeading;
  if (f.heroCopy.trim()) patch.heroCopy = f.heroCopy;
  if (f.intro.trim()) patch.intro = f.intro;
  const benefits = f.benefits.map((b) => b.trim()).filter(Boolean);
  if (benefits.length > 0) patch.benefits = benefits;
  const why = f.whyChooseUs.map((b) => b.trim()).filter(Boolean);
  if (why.length > 0) patch.whyChooseUs = why;
  const faqs = f.faqs
    .map((x) => ({ question: x.question.trim(), answer: x.answer.trim() }))
    .filter((x) => x.question && x.answer);
  if (faqs.length > 0) patch.faqs = faqs;
  if (f.ctaTitle.trim() || f.ctaDescription.trim()) {
    patch.cta = { title: f.ctaTitle.trim(), description: f.ctaDescription.trim() };
  }
  return patch;
}

const GROUP_META = {
  core: { label: 'Pages', icon: Home },
  service: { label: 'Service Pages', icon: Wrench },
  area: { label: 'Area Pages', icon: MapPin },
} as const;

export function SiteContentEditor({ data }: { data: EditorData }) {
  const { toast } = useToast();
  const [activePath, setActivePath] = React.useState(data.pages[0]?.path ?? '/');
  const [forms, setForms] = React.useState<Record<string, FormState>>(() =>
    Object.fromEntries(data.pages.map((p) => [p.path, initialForm(p)])),
  );
  const [dirty, setDirty] = React.useState<Record<string, boolean>>({});
  const [saving, setSaving] = React.useState(false);

  const page = data.pages.find((p) => p.path === activePath) ?? data.pages[0];
  const form = forms[page.path];

  const update = (patch: Partial<FormState>) => {
    setForms((f) => ({ ...f, [page.path]: { ...f[page.path], ...patch } }));
    setDirty((d) => ({ ...d, [page.path]: true }));
  };

  async function save() {
    setSaving(true);
    const res = await savePageOverrideAction(data.websiteId, page.path, toPatch(form));
    setSaving(false);
    if (res.ok) {
      setDirty((d) => ({ ...d, [page.path]: false }));
      toast({ variant: 'success', title: 'Saved', description: 'Changes apply to the live site immediately.' });
    } else {
      toast({ variant: 'error', title: 'Save failed', description: res.error });
    }
  }

  async function resetPage() {
    setSaving(true);
    const res = await savePageOverrideAction(data.websiteId, page.path, {});
    setSaving(false);
    if (res.ok) {
      setForms((f) => ({
        ...f,
        [page.path]: {
          seoTitle: '', metaDescription: '', heroHeading: '', heroCopy: '', intro: '',
          benefits: [], whyChooseUs: [], faqs: [], ctaTitle: '', ctaDescription: '',
        },
      }));
      setDirty((d) => ({ ...d, [page.path]: false }));
      toast({ variant: 'success', title: 'Reset to generated content' });
    } else {
      toast({ variant: 'error', title: 'Reset failed', description: res.error });
    }
  }

  const groups = (['core', 'service', 'area'] as const).map((g) => ({
    key: g,
    ...GROUP_META[g],
    pages: data.pages.filter((p) => p.group === g),
  }));

  return (
    <div className="flex h-dvh bg-background text-foreground">
      {/* Sidebar — all pages, grouped */}
      <aside className="flex w-72 shrink-0 flex-col border-r border-border bg-[#141c2b] text-white">
        <div className="border-b border-white/10 px-4 py-4">
          <a
            href={`/dashboard/websites/${data.websiteId}`}
            className="mb-3 inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white"
          >
            <ArrowLeft className="size-3.5" aria-hidden /> Back to dashboard
          </a>
          <p className="truncate text-sm font-semibold" title={data.websiteName}>{data.websiteName}</p>
          <p className="text-xs text-white/50">Site Editor</p>
        </div>
        <nav aria-label="Site pages" className="flex-1 overflow-y-auto px-2 py-3">
          {groups.map((g) =>
            g.pages.length > 0 ? (
              <div key={g.key} className="mb-4">
                <p className="flex items-center gap-1.5 px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/40">
                  <g.icon className="size-3.5" aria-hidden /> {g.label}
                </p>
                <ul>
                  {g.pages.map((p) => {
                    const active = p.path === page.path;
                    const hasOverride = Boolean(p.override) || dirty[p.path];
                    return (
                      <li key={p.path}>
                        <button
                          type="button"
                          onClick={() => setActivePath(p.path)}
                          aria-current={active ? 'page' : undefined}
                          className={cn(
                            'flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-sm',
                            active ? 'bg-white/15 font-medium text-white' : 'text-white/70 hover:bg-white/8 hover:text-white',
                          )}
                        >
                          <span className="truncate">{p.label}</span>
                          {hasOverride ? (
                            <span
                              className="size-1.5 shrink-0 rounded-full bg-amber-400"
                              title="Has custom content"
                              aria-label="Has custom content"
                            />
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null,
          )}
        </nav>
        <div className="border-t border-white/10 p-3">
          <a
            href={`/sites/${data.websiteId}${page.path === '/' ? '' : page.path}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-md border border-white/20 px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white"
          >
            <Eye className="size-4" aria-hidden /> Preview this page
          </a>
        </div>
      </aside>

      {/* Content form */}
      <main id="main" className="min-w-0 flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border bg-background/95 px-6 py-3 backdrop-blur">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold">{page.label}</h1>
            <p className="truncate font-mono text-xs text-muted-fg">{page.path}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={resetPage}
              disabled={saving || (!page.override && !dirty[page.path])}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm text-muted-fg hover:bg-muted hover:text-foreground disabled:opacity-40"
            >
              <RotateCcw className="size-4" aria-hidden /> Reset to generated
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving || !dirty[page.path]}
              className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-brand-fg hover:opacity-90 disabled:opacity-40"
            >
              {saving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              Save changes
            </button>
          </div>
        </div>

        <div className="mx-auto max-w-3xl space-y-8 px-6 py-6">
          <p className="rounded-lg bg-muted/60 px-4 py-3 text-sm text-muted-fg">
            <FileText className="mr-1.5 inline size-4 align-[-2px]" aria-hidden />
            Empty fields use the generated content (shown as placeholder). Fill a field to
            override it — changes go live on the site, hosted domains, and ZIP exports.
          </p>

          <Section title="SEO">
            <Field
              label="Page title"
              value={form.seoTitle}
              placeholder={page.content.seoTitle}
              maxLength={120}
              onChange={(v) => update({ seoTitle: v })}
            />
            <Field
              label="Meta description"
              value={form.metaDescription}
              placeholder={page.content.metaDescription}
              maxLength={320}
              multiline
              onChange={(v) => update({ metaDescription: v })}
            />
          </Section>

          <Section title="Hero">
            <Field
              label="Heading (H1)"
              value={form.heroHeading}
              placeholder={page.content.heroHeading}
              maxLength={160}
              onChange={(v) => update({ heroHeading: v })}
            />
            <Field
              label="Subheading"
              value={form.heroCopy}
              placeholder={page.content.heroCopy}
              maxLength={500}
              multiline
              onChange={(v) => update({ heroCopy: v })}
            />
          </Section>

          <Section title="Main content">
            <Field
              label="Intro paragraph"
              value={form.intro}
              placeholder={page.content.intro}
              maxLength={4000}
              multiline
              rows={5}
              onChange={(v) => update({ intro: v })}
            />
            <StringList
              label="Benefits"
              hint={`Generated: ${page.content.benefits.length} item(s). Add your own to replace them.`}
              items={form.benefits}
              onChange={(benefits) => update({ benefits })}
            />
            <StringList
              label="Why choose us"
              hint={`Generated: ${page.content.whyChooseUs.length} item(s). Add your own to replace them.`}
              items={form.whyChooseUs}
              onChange={(whyChooseUs) => update({ whyChooseUs })}
            />
          </Section>

          <Section title="FAQs">
            <p className="text-xs text-muted-fg">
              Generated: {page.content.faqs.length} FAQ(s). Adding any here replaces the generated set.
            </p>
            <FaqList items={form.faqs} onChange={(faqs) => update({ faqs })} />
          </Section>

          <Section title="Call to action">
            <Field
              label="CTA title"
              value={form.ctaTitle}
              placeholder={page.content.cta.title}
              maxLength={160}
              onChange={(v) => update({ ctaTitle: v })}
            />
            <Field
              label="CTA description"
              value={form.ctaDescription}
              placeholder={page.content.cta.description}
              maxLength={500}
              multiline
              onChange={(v) => update({ ctaDescription: v })}
            />
          </Section>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-fg">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

const inputCls =
  'w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-fg/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand';

function Field({
  label,
  value,
  placeholder,
  maxLength,
  multiline,
  rows = 3,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  maxLength: number;
  multiline?: boolean;
  rows?: number;
  onChange: (v: string) => void;
}) {
  const id = React.useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">{label}</label>
      {multiline ? (
        <textarea
          id={id}
          value={value}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={rows}
          onChange={(e) => onChange(e.target.value)}
          className={cn(inputCls, 'min-h-16')}
        />
      ) : (
        <input
          id={id}
          value={value}
          placeholder={placeholder}
          maxLength={maxLength}
          onChange={(e) => onChange(e.target.value)}
          className={inputCls}
        />
      )}
    </div>
  );
}

function StringList({
  label,
  hint,
  items,
  onChange,
}: {
  label: string;
  hint: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  return (
    <div>
      <p className="mb-1 text-sm font-medium">{label}</p>
      <p className="mb-2 text-xs text-muted-fg">{hint}</p>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={item}
              aria-label={`${label} item ${i + 1}`}
              onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))}
              className={inputCls}
            />
            <button
              type="button"
              aria-label={`Remove ${label} item ${i + 1}`}
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="rounded p-2 text-muted-fg hover:bg-red-500/10 hover:text-red-600"
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...items, ''])}
          className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-1.5 text-sm text-muted-fg hover:bg-muted hover:text-foreground"
        >
          <Plus className="size-4" aria-hidden /> Add item
        </button>
      </div>
    </div>
  );
}

function FaqList({
  items,
  onChange,
}: {
  items: ListItem[];
  onChange: (items: ListItem[]) => void;
}) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="rounded-md border border-border p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-fg">FAQ {i + 1}</p>
            <button
              type="button"
              aria-label={`Remove FAQ ${i + 1}`}
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="rounded p-1.5 text-muted-fg hover:bg-red-500/10 hover:text-red-600"
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          </div>
          <div className="space-y-2">
            <input
              value={item.question}
              placeholder="Question"
              aria-label={`FAQ ${i + 1} question`}
              onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, question: e.target.value } : x)))}
              className={inputCls}
            />
            <textarea
              value={item.answer}
              placeholder="Answer"
              aria-label={`FAQ ${i + 1} answer`}
              rows={2}
              onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, answer: e.target.value } : x)))}
              className={cn(inputCls, 'min-h-14')}
            />
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, { question: '', answer: '' }])}
        className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-1.5 text-sm text-muted-fg hover:bg-muted hover:text-foreground"
      >
        <Plus className="size-4" aria-hidden /> Add FAQ
      </button>
    </div>
  );
}
