'use client';

import * as React from 'react';
import { Check, Globe, MapPin, PencilLine, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/auth/FormField';
import { LoadingButton } from '@/components/auth/LoadingButton';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import {
  businessStepSchema,
  locationStepSchema,
  brandStepSchema,
  detailsStepSchema,
  seoStepSchema,
} from '@/lib/websites/schema';
import { createWebsiteAction } from '@/app/dashboard/websites/actions';

/**
 * Guided website-creation wizard. Collects configuration ONLY (no generation). Each
 * step is validated with its Zod schema before advancing; the final payload is sent
 * raw (nested by step) to `createWebsiteAction`, which re-validates + transforms
 * server-side and persists to `Website.businessConfig`.
 */

// Step 0 = Start (entry mode + optional import); steps 1..5 map to STEP_SCHEMAS; 6 = Review.
const STEP_TITLES = ['Start', 'Business', 'Location', 'Brand', 'Details', 'SEO', 'Review'] as const;
const STEP_SCHEMAS = [
  businessStepSchema,
  locationStepSchema,
  brandStepSchema,
  detailsStepSchema,
  seoStepSchema,
];

type Form = Record<string, string>;

const INITIAL: Form = {
  mode: 'manual',
  importName: '',
  importPhone: '',
  importAddress: '',
  importUrl: '',
  businessName: '',
  category: '',
  primaryService: '',
  additionalServices: '',
  country: 'United States',
  state: '',
  city: '',
  zipCodes: '',
  neighborhoods: '',
  logoUrl: '',
  primaryColor: '#2563eb',
  accentColor: '#f97316',
  fontFamily: 'Inter',
  phone: '',
  email: '',
  hours: '',
  website: '',
  facebook: '',
  instagram: '',
  x: '',
  targetKeywords: '',
  competitors: '',
  servicePages: '5',
  locationPages: '10',
};

const STEP_FIELDS: string[][] = [
  ['businessName', 'category', 'primaryService', 'additionalServices'],
  ['country', 'state', 'city', 'zipCodes', 'neighborhoods'],
  ['logoUrl', 'primaryColor', 'accentColor', 'fontFamily'],
  ['phone', 'email', 'hours', 'website', 'facebook', 'instagram', 'x'],
  ['targetKeywords', 'competitors', 'servicePages', 'locationPages'],
];

function slice(form: Form, fields: string[]): Record<string, string> {
  return Object.fromEntries(fields.map((f) => [f, form[f] ?? '']));
}

export function WebsiteWizard({ workspaceId }: { workspaceId: string }) {
  const { toast } = useToast();
  const [step, setStep] = React.useState(0);
  const [form, setForm] = React.useState<Form>(INITIAL);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [pending, startTransition] = React.useTransition();

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  function validateStep(i: number): boolean {
    if (i === 0) {
      // Entry mode: import/GBP require at least a business name to carry forward.
      if (form.mode !== 'manual' && (form.importName ?? '').trim().length < 2) {
        setErrors({ importName: 'Enter the business name' });
        return false;
      }
      setErrors({});
      return true;
    }
    if (i > STEP_SCHEMAS.length) return true; // review step
    const result = STEP_SCHEMAS[i - 1]!.safeParse(slice(form, STEP_FIELDS[i - 1]!));
    if (result.success) {
      setErrors({});
      return true;
    }
    const flat = result.error.flatten().fieldErrors;
    const nextErrors: Record<string, string> = {};
    for (const [k, v] of Object.entries(flat)) if (v && v[0]) nextErrors[k] = v[0];
    setErrors(nextErrors);
    return false;
  }

  function next() {
    if (!validateStep(step)) return;
    // Carry imported fields into the manual steps when leaving Start.
    if (step === 0 && form.mode !== 'manual') {
      setForm((f) => ({
        ...f,
        businessName: f.businessName || f.importName,
        phone: f.phone || f.importPhone,
        website: f.website || f.importUrl,
      }));
    }
    setStep((s) => Math.min(s + 1, STEP_TITLES.length - 1));
  }
  function back() {
    setErrors({});
    setStep((s) => Math.max(s - 1, 0));
  }

  function submit() {
    const payload = {
      business: slice(form, STEP_FIELDS[0]!),
      location: slice(form, STEP_FIELDS[1]!),
      brand: slice(form, STEP_FIELDS[2]!),
      details: slice(form, STEP_FIELDS[3]!),
      seo: slice(form, STEP_FIELDS[4]!),
    };
    startTransition(async () => {
      const res = await createWebsiteAction(workspaceId, payload);
      // On success the action redirects; only an error result returns here.
      if (res && !res.ok) {
        toast({ variant: 'error', title: 'Could not create website', description: res.error });
      }
    });
  }

  return (
    <div className="space-y-6">
      <Stepper step={step} />

      <Card className="p-6">
        {step === 0 ? (
          <StartStep form={form} set={set} errors={errors} onMode={(m) => setForm((f) => ({ ...f, mode: m }))} />
        ) : null}
        {step === 1 ? <BusinessStep form={form} set={set} errors={errors} /> : null}
        {step === 2 ? <LocationStep form={form} set={set} errors={errors} /> : null}
        {step === 3 ? <BrandStep form={form} set={set} errors={errors} /> : null}
        {step === 4 ? <DetailsStep form={form} set={set} errors={errors} /> : null}
        {step === 5 ? <SeoStep form={form} set={set} errors={errors} /> : null}
        {step === 6 ? <ReviewStep form={form} /> : null}
      </Card>

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" onClick={back} disabled={step === 0 || pending}>
          Back
        </Button>
        {step < STEP_TITLES.length - 1 ? (
          <Button type="button" onClick={next}>
            Continue
          </Button>
        ) : (
          <LoadingButton type="button" loading={pending} loadingText="Creating…" onClick={submit}>
            Create website
          </LoadingButton>
        )}
      </div>
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-2 text-sm">
      {STEP_TITLES.map((title, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <li key={title} className="flex items-center gap-2" aria-current={active ? 'step' : undefined}>
            <span
              className={cn(
                'flex size-6 items-center justify-center rounded-full text-xs font-semibold',
                active ? 'bg-brand text-brand-fg' : done ? 'bg-brand/20 text-brand' : 'bg-muted text-muted-fg',
              )}
            >
              {done ? <Check className="size-3.5" aria-hidden /> : i + 1}
            </span>
            <span className={cn(active ? 'font-medium text-foreground' : 'text-muted-fg')}>
              {title}
              {active ? <span className="sr-only"> (current step)</span> : null}
            </span>
            {i < STEP_TITLES.length - 1 ? <span className="mx-1 text-border">/</span> : null}
          </li>
        );
      })}
    </ol>
  );
}

type StepProps = {
  form: Form;
  set: (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  errors: Record<string, string>;
};

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="min-h-20 w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
    />
  );
}

const MODES = [
  { key: 'manual', label: 'Manual entry', description: 'Fill in the details yourself', icon: PencilLine },
  { key: 'import', label: 'Import website', description: 'Start from an existing site URL', icon: Globe },
  { key: 'gbp', label: 'Google Business Profile', description: 'Use your business listing details', icon: MapPin },
] as const;

function StartStep({
  form,
  set,
  errors,
  onMode,
}: StepProps & { onMode: (mode: string) => void }) {
  const mode = form.mode ?? 'manual';
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-foreground">How do you want to start?</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {MODES.map((m) => {
            const active = mode === m.key;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => onMode(m.key)}
                aria-pressed={active}
                className={cn(
                  'flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors',
                  active ? 'border-brand bg-brand/5' : 'border-border hover:bg-muted',
                )}
              >
                <span className={cn('flex size-9 items-center justify-center rounded-md', active ? 'bg-brand text-brand-fg' : 'bg-muted text-muted-fg')}>
                  <m.icon className="size-5" aria-hidden />
                </span>
                <span className="text-sm font-semibold text-foreground">{m.label}</span>
                <span className="text-xs text-muted-fg">{m.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      {mode !== 'manual' ? (
        <div className="space-y-4 rounded-lg border border-border p-4">
          <p className="text-sm text-muted-fg">
            {mode === 'gbp'
              ? 'Enter your Google Business Profile details. Automated lookup is a follow-up; for now these seed the form.'
              : 'Enter the existing business details. We’ll use them to seed the form.'}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="importName" label="Business name" error={errors.importName} required>
              <Input value={form.importName} onChange={set('importName')} placeholder="Apex Plumbing Co." />
            </FormField>
            <FormField id="importPhone" label="Phone">
              <Input value={form.importPhone} onChange={set('importPhone')} placeholder="(512) 555-1234" />
            </FormField>
          </div>
          <FormField id="importAddress" label="Address">
            <Input value={form.importAddress} onChange={set('importAddress')} placeholder="123 Main St, Austin, TX" />
          </FormField>
          <FormField id="importUrl" label="Website URL">
            <Input value={form.importUrl} onChange={set('importUrl')} placeholder="https://…" />
          </FormField>
        </div>
      ) : null}

      <div className="flex items-start gap-2 rounded-lg bg-brand/5 p-3 text-xs text-muted-fg">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
        <span>
          At generation, AI will determine industry, services, keywords, brand colors, cities,
          SEO strategy, blog strategy, internal links, and location pages — you can edit
          everything before generating. (Generation ships in Phase 7.2.4.)
        </span>
      </div>
    </div>
  );
}

function BusinessStep({ form, set, errors }: StepProps) {
  return (
    <div className="space-y-4">
      <FormField id="businessName" label="Business name" error={errors.businessName} required>
        <Input value={form.businessName} onChange={set('businessName')} placeholder="Apex Plumbing Co." />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="category" label="Business category" error={errors.category} required>
          <Input value={form.category} onChange={set('category')} placeholder="Plumbing" />
        </FormField>
        <FormField id="primaryService" label="Primary service" error={errors.primaryService} required>
          <Input value={form.primaryService} onChange={set('primaryService')} placeholder="Drain Cleaning" />
        </FormField>
      </div>
      <FormField
        id="additionalServices"
        label="Additional services"
        hint="Comma or newline separated."
      >
        <Input value={form.additionalServices} onChange={set('additionalServices')} placeholder="Water Heaters, Leak Repair" />
      </FormField>
    </div>
  );
}

function LocationStep({ form, set, errors }: StepProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField id="country" label="Country" error={errors.country}>
          <Input value={form.country} onChange={set('country')} />
        </FormField>
        <FormField id="state" label="State" error={errors.state} required>
          <Input value={form.state} onChange={set('state')} placeholder="Texas" />
        </FormField>
        <FormField id="city" label="City" error={errors.city} required>
          <Input value={form.city} onChange={set('city')} placeholder="Austin" />
        </FormField>
      </div>
      <FormField id="zipCodes" label="ZIP codes" hint="Comma separated.">
        <Input value={form.zipCodes} onChange={set('zipCodes')} placeholder="78701, 78702" />
      </FormField>
      <FormField id="neighborhoods" label="Neighborhoods" hint="Comma separated.">
        <Input value={form.neighborhoods} onChange={set('neighborhoods')} placeholder="Downtown, Hyde Park" />
      </FormField>
    </div>
  );
}

function ColorField({ id, label, value, onChange, error }: { id: string; label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; error?: string }) {
  return (
    <FormField id={id} label={label} error={error}>
      <div className="flex items-center gap-2">
        <span className="size-9 shrink-0 rounded-md border border-border" style={{ backgroundColor: value }} aria-hidden />
        <Input value={value} onChange={onChange} placeholder="#2563eb" />
      </div>
    </FormField>
  );
}

function BrandStep({ form, set, errors }: StepProps) {
  return (
    <div className="space-y-4">
      <FormField id="logoUrl" label="Logo URL" hint="Optional. Media uploads come later." error={errors.logoUrl}>
        <Input value={form.logoUrl} onChange={set('logoUrl')} placeholder="https://…/logo.png" />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <ColorField id="primaryColor" label="Primary color" value={form.primaryColor} onChange={set('primaryColor')} error={errors.primaryColor} />
        <ColorField id="accentColor" label="Accent color" value={form.accentColor} onChange={set('accentColor')} error={errors.accentColor} />
      </div>
      <FormField id="fontFamily" label="Font" error={errors.fontFamily}>
        <Input value={form.fontFamily} onChange={set('fontFamily')} placeholder="Inter" />
      </FormField>
    </div>
  );
}

function DetailsStep({ form, set, errors }: StepProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="phone" label="Phone" error={errors.phone} required>
          <Input value={form.phone} onChange={set('phone')} placeholder="(512) 555-1234" />
        </FormField>
        <FormField id="email" label="Email" error={errors.email} required>
          <Input value={form.email} onChange={set('email')} placeholder="hello@business.com" />
        </FormField>
      </div>
      <FormField id="hours" label="Business hours" hint="Optional.">
        <TextArea id="hours" value={form.hours} onChange={set('hours')} placeholder="Mon–Fri 8am–6pm" />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="website" label="Website" error={errors.website}>
          <Input value={form.website} onChange={set('website')} placeholder="https://…" />
        </FormField>
        <FormField id="facebook" label="Facebook" error={errors.facebook}>
          <Input value={form.facebook} onChange={set('facebook')} placeholder="https://facebook.com/…" />
        </FormField>
        <FormField id="instagram" label="Instagram" error={errors.instagram}>
          <Input value={form.instagram} onChange={set('instagram')} placeholder="https://instagram.com/…" />
        </FormField>
        <FormField id="x" label="X (Twitter)" error={errors.x}>
          <Input value={form.x} onChange={set('x')} placeholder="https://x.com/…" />
        </FormField>
      </div>
    </div>
  );
}

function SeoStep({ form, set, errors }: StepProps) {
  return (
    <div className="space-y-4">
      <FormField id="targetKeywords" label="Target keywords" hint="Comma separated.">
        <Input value={form.targetKeywords} onChange={set('targetKeywords')} placeholder="emergency plumber austin, drain cleaning" />
      </FormField>
      <FormField id="competitors" label="Competitors" hint="Optional, comma separated.">
        <Input value={form.competitors} onChange={set('competitors')} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="servicePages" label="Service pages" error={errors.servicePages}>
          <Input type="number" min={0} value={form.servicePages} onChange={set('servicePages')} />
        </FormField>
        <FormField id="locationPages" label="Location pages" error={errors.locationPages}>
          <Input type="number" min={0} value={form.locationPages} onChange={set('locationPages')} />
        </FormField>
      </div>
    </div>
  );
}

function ReviewStep({ form }: { form: Form }) {
  const rows: [string, string][] = [
    ['Business', form.businessName || '—'],
    ['Category', form.category || '—'],
    ['Primary service', form.primaryService || '—'],
    ['Location', [form.city, form.state, form.country].filter(Boolean).join(', ') || '—'],
    ['Contact', [form.phone, form.email].filter(Boolean).join(' · ') || '—'],
    ['Pages', `${form.servicePages || 0} service · ${form.locationPages || 0} location`],
  ];
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-fg">
        Review the configuration. Nothing is generated yet — you can start generation from the
        website after it&apos;s created.
      </p>
      <dl className="divide-y divide-border rounded-lg border border-border">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 px-4 py-3 text-sm">
            <dt className="text-muted-fg">{label}</dt>
            <dd className="text-right font-medium text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
