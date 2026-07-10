'use client';

import * as React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { passwordSchema } from '@/lib/auth/validation';
import { FormField } from '@/components/auth/FormField';
import { PasswordField } from '@/components/auth/PasswordField';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';
import { LoadingButton } from '@/components/auth/LoadingButton';
import { useToast } from '@/components/ui/toast';

// Client-side form schema: confirm-password match (the token comes from the URL).
const formSchema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((v) => v.password === v.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });
type FormValues = z.infer<typeof formSchema>;

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { password: '', confirm: '' },
  });

  const password = watch('password');

  const missingToken = !token || token.length < 16;

  async function onSubmit(values: FormValues) {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: values.password }),
      });
      if (res.ok) {
        toast({
          variant: 'success',
          title: 'Password updated',
          description: 'You can now sign in with your new password.',
        });
        router.push('/login');
        return;
      }
      if (res.status === 429) {
        toast({ variant: 'error', title: 'Too many attempts', description: 'Try again shortly.' });
        return;
      }
      toast({
        variant: 'error',
        title: 'Reset link invalid or expired',
        description: 'Request a new password-reset link and try again.',
      });
    } catch {
      toast({ variant: 'error', title: 'Network error', description: 'Please try again.' });
    }
  }

  if (missingToken) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-muted-fg">
          This reset link is missing or invalid. Request a new one.
        </p>
        <Link
          href="/forgot-password"
          className="inline-block text-sm font-medium text-brand hover:underline"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormField
        id="password"
        label="New password"
        error={errors.password?.message}
        hint="At least 8 characters."
        required
      >
        <PasswordField autoComplete="new-password" {...register('password')} />
      </FormField>
      <PasswordStrengthMeter password={password ?? ''} />

      <FormField id="confirm" label="Confirm password" error={errors.confirm?.message} required>
        <PasswordField autoComplete="new-password" {...register('confirm')} />
      </FormField>

      <LoadingButton
        type="submit"
        size="lg"
        className="w-full"
        loading={isSubmitting}
        loadingText="Updating…"
      >
        Update password
      </LoadingButton>
    </form>
  );
}
