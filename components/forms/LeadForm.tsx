'use client';

import { useState, useId, cloneElement, isValidElement } from 'react';
import type { ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { leadSchema, type LeadInput } from '@/lib/forms/lead';

interface LeadFormProps {
  services?: string[];
  /** Optional heading shown above the form. */
  title?: string;
}

export function LeadForm({ services = [], title }: LeadFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LeadInput>({
    resolver: zodResolver(leadSchema),
    defaultValues: { name: '', phone: '', email: '', message: '', company: '' },
  });

  async function onSubmit(data: LeadInput) {
    try {
      await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch {
      // Network errors are non-blocking for the demo; the CRM hook lives in the API route.
    }
    setSubmitted(true);
    reset();
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-background p-8 text-center">
        <CheckCircle2 className="size-10 text-brand" />
        <h3 className="text-xl font-semibold">Thanks — we&rsquo;ll be in touch!</h3>
        <p className="text-muted-fg">
          A team member will reach out shortly to confirm your appointment.
        </p>
        <Button variant="outline" onClick={() => setSubmitted(false)}>
          Submit another request
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-lg border border-border bg-background p-6 shadow-sm"
      noValidate
    >
      {title && <h3 className="text-xl font-semibold">{title}</h3>}

      {/* Honeypot: hidden from users, visible to bots */}
      <div className="hidden" aria-hidden>
        <label>
          Company
          <input tabIndex={-1} autoComplete="off" {...register('company')} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" error={errors.name?.message}>
          <Input placeholder="Jane Doe" {...register('name')} />
        </Field>
        <Field label="Phone" error={errors.phone?.message}>
          <Input type="tel" placeholder="(555) 123-4567" {...register('phone')} />
        </Field>
      </div>

      <Field label="Email" error={errors.email?.message}>
        <Input type="email" placeholder="you@example.com" {...register('email')} />
      </Field>

      {services.length > 0 && (
        <Field label="Service needed" error={errors.service?.message}>
          <select
            className="flex h-11 w-full rounded-md border border-border bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            {...register('service')}
          >
            <option value="">Select a service…</option>
            {services.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
      )}

      <Field label="How can we help?" error={errors.message?.message}>
        <Textarea
          rows={4}
          placeholder="Briefly describe what you need…"
          {...register('message')}
        />
      </Field>

      <Button type="submit" size="lg" variant="accent" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        {isSubmitting ? 'Sending…' : 'Request My Free Quote'}
      </Button>
      <p className="text-center text-xs text-muted-fg">
        By submitting, you agree to be contacted about your request. No spam.
      </p>
    </form>
  );
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
  const fieldId = useId();
  const errorId = `${fieldId}-error`;
  // Associate the label + error message with the control for screen readers.
  const control =
    isValidElement(children)
      ? cloneElement(children as ReactElement<Record<string, unknown>>, {
          id: fieldId,
          'aria-invalid': error ? true : undefined,
          'aria-describedby': error ? errorId : undefined,
        })
      : children;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={fieldId}>{label}</Label>
      {control}
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
