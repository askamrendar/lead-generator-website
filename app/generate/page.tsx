'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Sparkles, CheckCircle2, FileCode2, MapPin, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { intakeSchema, intakeToConfig, type IntakeInput } from '@/lib/forms/intake';

interface GenerateResult {
  ok: boolean;
  stats?: { services: number; cities: number; totalPages: number };
  routes?: string[];
  config?: unknown;
  error?: string;
}

const defaults: Partial<IntakeInput> = {
  brandPrimary: '221 83% 53%',
  brandAccent: '24 95% 53%',
  siteUrl: '',
  servicesRaw:
    'Drain Cleaning | Clear clogged drains fast with hydro-jetting.\nWater Heater Repair | Same-day tank and tankless water heater service.\nEmergency Plumbing | 24/7 response for burst pipes and major leaks.',
  citiesRaw:
    'Austin | 78701,78702,78745 | Mueller,Hyde Park,Zilker\nRound Rock | 78664,78681 | Teravista,Forest Creek',
};

export default function GeneratePage() {
  const [result, setResult] = useState<GenerateResult | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<IntakeInput>({
    resolver: zodResolver(intakeSchema),
    defaultValues: defaults,
  });

  async function onSubmit(input: IntakeInput) {
    const candidate = intakeToConfig(input);
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(candidate),
    });
    setResult(await res.json());
  }

  return (
    <div className="container py-14">
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-4 py-1.5 text-sm font-semibold text-brand">
          <Sparkles className="size-4" /> Website Generator
        </span>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight">
          Generate a Local Business Website
        </h1>
        <p className="mt-4 text-lg text-muted-fg">
          Enter the business details below. We validate them against the site
          schema and show you exactly which pages will be generated.
        </p>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-start">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-8 rounded-xl border border-border bg-background p-6 shadow-sm"
          noValidate
        >
          <Fieldset legend="Business Identity">
            <Grid>
              <Field label="Business name" error={errors.name?.message}>
                <Input placeholder="Apex Plumbing Co." {...register('name')} />
              </Field>
              <Field label="Category" error={errors.category?.message}>
                <Input placeholder="Plumbing" {...register('category')} />
              </Field>
            </Grid>
            <Field label="Primary service" error={errors.primaryService?.message}>
              <Input placeholder="Plumbing Services" {...register('primaryService')} />
            </Field>
            <Field label="Tagline" error={errors.tagline?.message}>
              <Input placeholder="Fast, Honest Plumbing — Done Right" {...register('tagline')} />
            </Field>
            <Field label="Description" error={errors.description?.message}>
              <Textarea rows={3} placeholder="A short paragraph about the business…" {...register('description')} />
            </Field>
          </Fieldset>

          <Fieldset legend="Contact & Location">
            <Grid>
              <Field label="Phone" error={errors.phone?.message}>
                <Input placeholder="512-555-0142" {...register('phone')} />
              </Field>
              <Field label="Email" error={errors.email?.message}>
                <Input placeholder="service@example.com" {...register('email')} />
              </Field>
            </Grid>
            <Field label="Street address" error={errors.street?.message}>
              <Input placeholder="1200 Springdale Rd" {...register('street')} />
            </Field>
            <Grid>
              <Field label="City" error={errors.city?.message}>
                <Input placeholder="Austin" {...register('city')} />
              </Field>
              <Field label="ZIP" error={errors.zip?.message}>
                <Input placeholder="78721" {...register('zip')} />
              </Field>
            </Grid>
            <Grid>
              <Field label="State" error={errors.stateName?.message}>
                <Input placeholder="Texas" {...register('stateName')} />
              </Field>
              <Field label="State code" error={errors.stateAbbr?.message}>
                <Input placeholder="TX" maxLength={2} {...register('stateAbbr')} />
              </Field>
            </Grid>
          </Fieldset>

          <Fieldset legend="Brand Colors (HSL)">
            <Grid>
              <Field label="Primary" error={errors.brandPrimary?.message}>
                <Input placeholder="221 83% 53%" {...register('brandPrimary')} />
              </Field>
              <Field label="Accent" error={errors.brandAccent?.message}>
                <Input placeholder="24 95% 53%" {...register('brandAccent')} />
              </Field>
            </Grid>
          </Fieldset>

          <Fieldset
            legend="Services"
            hint='One per line — "Name | short description"'
          >
            <Field label="" error={errors.servicesRaw?.message}>
              <Textarea rows={4} className="font-mono text-xs" {...register('servicesRaw')} />
            </Field>
          </Fieldset>

          <Fieldset
            legend="Service Areas"
            hint='One per line — "City | zip,zip | neighborhood,neighborhood"'
          >
            <Field label="" error={errors.citiesRaw?.message}>
              <Textarea rows={4} className="font-mono text-xs" {...register('citiesRaw')} />
            </Field>
          </Fieldset>

          <Field label="Production URL (optional)" error={errors.siteUrl?.message}>
            <Input placeholder="https://apexplumbing.com" {...register('siteUrl')} />
          </Field>

          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            {isSubmitting ? 'Validating…' : 'Generate Website Plan'}
          </Button>
        </form>

        <div className="lg:sticky lg:top-24">
          <ResultPanel result={result} />
        </div>
      </div>
    </div>
  );
}

function ResultPanel({ result }: { result: GenerateResult | null }) {
  if (!result) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-fg">
        <FileCode2 className="mx-auto size-8" />
        <p className="mt-3 text-sm">
          Your generated site plan — pages, routes, and validated config — will
          appear here.
        </p>
      </div>
    );
  }

  if (!result.ok) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        <p className="font-semibold">Validation failed</p>
        <p className="mt-1">{result.error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-background p-6 shadow-sm">
      <div className="flex items-center gap-2 text-brand">
        <CheckCircle2 className="size-5" />
        <span className="font-semibold">Valid — ready to generate</span>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <Stat icon={<Wrench className="size-4" />} value={result.stats!.services} label="Services" />
        <Stat icon={<MapPin className="size-4" />} value={result.stats!.cities} label="Cities" />
        <Stat icon={<FileCode2 className="size-4" />} value={result.stats!.totalPages} label="Pages" />
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold">Generated routes</p>
        <ul className="max-h-64 space-y-1 overflow-auto rounded-md border border-border bg-muted/40 p-3 font-mono text-xs">
          {result.routes!.map((r) => (
            <li key={r} className="text-muted-fg">
              {r}
            </li>
          ))}
        </ul>
      </div>

      <details className="text-xs">
        <summary className="cursor-pointer font-semibold">View config JSON</summary>
        <pre className="mt-2 max-h-64 overflow-auto rounded-md border border-border bg-muted/40 p-3">
          {JSON.stringify(result.config, null, 2)}
        </pre>
      </details>
    </div>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex justify-center text-brand">{icon}</div>
      <div className="mt-1 text-xl font-bold">{value}</div>
      <div className="text-xs text-muted-fg">{label}</div>
    </div>
  );
}

function Fieldset({
  legend,
  hint,
  children,
}: {
  legend: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="space-y-4">
      <div>
        <legend className="text-sm font-semibold uppercase tracking-wide text-muted-fg">
          {legend}
        </legend>
        {hint && <p className="mt-0.5 text-xs text-muted-fg">{hint}</p>}
      </div>
      {children}
    </fieldset>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      {label && <Label>{label}</Label>}
      {children}
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
