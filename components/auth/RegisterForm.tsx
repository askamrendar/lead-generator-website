'use client';

import * as React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@/lib/auth/validation';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/auth/FormField';
import { PasswordField } from '@/components/auth/PasswordField';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';
import { LoadingButton } from '@/components/auth/LoadingButton';
import { OAuthButtons } from '@/components/auth/OAuthButtons';
import { AuthDivider } from '@/components/auth/AuthDivider';
import { useToast } from '@/components/ui/toast';
import type { OAuthProviderId } from '@/lib/auth/providers/enabled';

export function RegisterForm({
  providers,
  callbackUrl = '/dashboard',
}: {
  providers: OAuthProviderId[];
  callbackUrl?: string;
}) {
  const { toast } = useToast();
  const [done, setDone] = React.useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const password = watch('password');

  async function onSubmit(values: RegisterInput) {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (res.status === 429) {
        toast({
          variant: 'error',
          title: 'Too many attempts',
          description: 'Please wait a moment and try again.',
        });
        return;
      }
      // Enumeration-safe API: any non-429 non-5xx is a generic success.
      if (res.ok || res.status === 200 || res.status === 201) {
        setDone(true);
        toast({
          variant: 'success',
          title: 'Check your email',
          description: 'If this email can be registered, a verification link is on its way.',
        });
        return;
      }
      toast({ variant: 'error', title: 'Something went wrong', description: 'Please try again.' });
    } catch {
      toast({ variant: 'error', title: 'Network error', description: 'Please try again.' });
    }
  }

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-muted-fg">
          We&apos;ve sent a verification link to your inbox. Follow it to activate your
          account, then sign in.
        </p>
        <Link
          href="/login"
          className="inline-block text-sm font-medium text-brand hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <OAuthButtons providers={providers} callbackUrl={callbackUrl} />
      {providers.length > 0 ? <AuthDivider>or sign up with email</AuthDivider> : null}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField id="name" label="Name" error={errors.name?.message} required>
          <Input autoComplete="name" placeholder="Jane Doe" {...register('name')} />
        </FormField>

        <FormField id="email" label="Email" error={errors.email?.message} required>
          <Input
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...register('email')}
          />
        </FormField>

        <FormField
          id="password"
          label="Password"
          error={errors.password?.message}
          hint="At least 8 characters."
          required
        >
          <PasswordField autoComplete="new-password" {...register('password')} />
        </FormField>
        <PasswordStrengthMeter password={password ?? ''} />

        <LoadingButton
          type="submit"
          size="lg"
          className="w-full"
          loading={isSubmitting}
          loadingText="Creating account…"
        >
          Create account
        </LoadingButton>
      </form>

      <p className="text-center text-sm text-muted-fg">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
