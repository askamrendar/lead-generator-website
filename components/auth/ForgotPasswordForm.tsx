'use client';

import * as React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/auth/validation';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/auth/FormField';
import { LoadingButton } from '@/components/auth/LoadingButton';
import { useToast } from '@/components/ui/toast';

export function ForgotPasswordForm() {
  const { toast } = useToast();
  const [sent, setSent] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values: ForgotPasswordInput) {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (res.status === 429) {
        toast({ variant: 'error', title: 'Too many attempts', description: 'Try again shortly.' });
        return;
      }
      // Enumeration-safe: always a generic success.
      setSent(true);
    } catch {
      toast({ variant: 'error', title: 'Network error', description: 'Please try again.' });
    }
  }

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-muted-fg">
          If an account exists for that email, a password-reset link has been sent.
          Check your inbox.
        </p>
        <Link href="/login" className="inline-block text-sm font-medium text-brand hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormField id="email" label="Email" error={errors.email?.message} required>
        <Input
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          {...register('email')}
        />
      </FormField>
      <LoadingButton
        type="submit"
        size="lg"
        className="w-full"
        loading={isSubmitting}
        loadingText="Sending link…"
      >
        Send reset link
      </LoadingButton>
      <p className="text-center text-sm text-muted-fg">
        <Link href="/login" className="font-medium text-brand hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
