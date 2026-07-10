'use client';

import { scorePassword } from '@/lib/auth/password-strength';
import { cn } from '@/lib/utils';

/**
 * Visual strength indicator driven by the pure `scorePassword` scorer. Advisory
 * only — the enforced minimum lives in the Zod schema. Announces the current label
 * politely for screen readers.
 */
const BAR_COLORS = [
  'bg-red-500',
  'bg-red-500',
  'bg-amber-500',
  'bg-yellow-500',
  'bg-green-500',
] as const;

export function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null;
  const { score, label, suggestions } = scorePassword(password);

  return (
    <div className="space-y-1.5" aria-live="polite">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors',
              i < score ? BAR_COLORS[score] : 'bg-muted',
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-fg">
        Password strength: <span className="font-medium text-foreground">{label}</span>
        {suggestions.length > 0 ? ` — ${suggestions[0]}` : ''}
      </p>
    </div>
  );
}
