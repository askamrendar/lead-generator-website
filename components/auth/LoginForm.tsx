'use client';

import * as React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { loginSchema, type LoginInput } from '@/lib/auth/validation';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/auth/FormField';
import { PasswordField } from '@/components/auth/PasswordField';
import { LoadingButton } from '@/components/auth/LoadingButton';
import { RememberMe } from '@/components/auth/RememberMe';
import { OAuthButtons } from '@/components/auth/OAuthButtons';
import { AuthDivider } from '@/components/auth/AuthDivider';
import { useToast } from '@/components/ui/toast';
import type { OAuthProviderId } from '@/lib/auth/providers/enabled';

const LAST_EMAIL_KEY = 'auth:last-email';

/** Only allow internal callback paths (prevents open-redirect). */
function safeCallback(raw: string | null, fallback: string): string {
  return raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : fallback;
}

export function LoginForm({
  providers,
  callbackUrl = '/dashboard',
  initialError,
}: {
  providers: OAuthProviderId[];
  callbackUrl?: string;
  /** An `?error=` code forwarded by an Auth.js redirect (e.g. failed OAuth). */
  initialError?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [remember, setRemember] = React.useState(true);
  const target = safeCallback(callbackUrl, '/dashboard');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // Prefill the remembered email; surface an Auth.js error redirect as a toast.
  React.useEffect(() => {
    try {
      const last = localStorage.getItem(LAST_EMAIL_KEY);
      if (last) setValue('email', last);
    } catch {
      /* ignore */
    }
    if (initialError) {
      toast({
        variant: 'error',
        title: 'Sign-in failed',
        description: 'We could not sign you in. Please try again.',
      });
    }
  }, [initialError, setValue, toast]);

  async function onSubmit(values: LoginInput) {
    const res = await signIn('credentials', {
      email: values.email,
      password: values.password,
      redirect: false,
    });
    if (!res || res.error) {
      toast({
        variant: 'error',
        title: 'Sign-in failed',
        description: 'Incorrect email or password.',
      });
      return;
    }
    try {
      if (remember) localStorage.setItem(LAST_EMAIL_KEY, values.email);
      else localStorage.removeItem(LAST_EMAIL_KEY);
    } catch {
      /* ignore */
    }
    router.push(target);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <OAuthButtons providers={providers} callbackUrl={callbackUrl} />
      {providers.length > 0 ? <AuthDivider>or continue with email</AuthDivider> : null}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField id="email" label="Email" error={errors.email?.message} required>
          <Input
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...register('email')}
          />
        </FormField>

        <FormField id="password" label="Password" error={errors.password?.message} required>
          <PasswordField autoComplete="current-password" {...register('password')} />
        </FormField>

        <div className="flex items-center justify-between">
          <RememberMe checked={remember} onChange={setRemember} />
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-brand hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <LoadingButton
          type="submit"
          size="lg"
          className="w-full"
          loading={isSubmitting}
          loadingText="Signing in…"
        >
          Sign in
        </LoadingButton>
      </form>

      <p className="text-center text-sm text-muted-fg">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-medium text-brand hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
