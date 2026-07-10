/**
 * Password strength scoring — PURE (no deps) so it is shared by the client
 * PasswordStrengthMeter and is unit-testable (tests/auth-password-strength.test.mjs).
 * Advisory only: the authoritative minimum is enforced by Zod in
 * `lib/auth/validation.ts` (min 8 chars). This adds UX guidance, not a second rule.
 */

export type StrengthScore = 0 | 1 | 2 | 3 | 4;

export interface PasswordStrength {
  /** 0 (empty/weakest) … 4 (strong). */
  score: StrengthScore;
  /** Human label for the score. */
  label: 'Empty' | 'Very weak' | 'Weak' | 'Fair' | 'Good' | 'Strong';
  /** Actionable ways to improve — empty once strong. */
  suggestions: string[];
}

const LABELS: Record<StrengthScore, PasswordStrength['label']> = {
  0: 'Very weak',
  1: 'Weak',
  2: 'Fair',
  3: 'Good',
  4: 'Strong',
};

export function scorePassword(password: string): PasswordStrength {
  if (!password) {
    return { score: 0, label: 'Empty', suggestions: ['Enter a password'] };
  }

  const checks = {
    length8: password.length >= 8,
    length12: password.length >= 12,
    lower: /[a-z]/.test(password),
    upper: /[A-Z]/.test(password),
    digit: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };

  // Base points from character variety (max 4), plus a bonus for good length.
  let points = 0;
  if (checks.lower) points += 1;
  if (checks.upper) points += 1;
  if (checks.digit) points += 1;
  if (checks.symbol) points += 1;
  if (checks.length12) points += 1;

  // Too-short passwords can never score above "Weak", regardless of variety.
  if (!checks.length8) points = Math.min(points, 1);

  const score = Math.max(0, Math.min(4, points)) as StrengthScore;

  const suggestions: string[] = [];
  if (!checks.length8) suggestions.push('Use at least 8 characters');
  else if (!checks.length12) suggestions.push('Longer passwords are stronger (12+)');
  if (!checks.lower) suggestions.push('Add a lowercase letter');
  if (!checks.upper) suggestions.push('Add an uppercase letter');
  if (!checks.digit) suggestions.push('Add a number');
  if (!checks.symbol) suggestions.push('Add a symbol');

  return { score, label: LABELS[score], suggestions };
}
