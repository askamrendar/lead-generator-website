import * as React from 'react';

/**
 * "Remember me" checkbox. Controls whether the login form persists the last-used
 * email for convenient re-entry (see LoginForm). Session-duration control is an
 * Auth.js follow-up; today this drives email pre-fill only.
 */
export function RememberMe({
  checked,
  onChange,
  id = 'remember-me',
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer select-none items-center gap-2">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 rounded border-border text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1"
      />
      <span className="text-sm text-muted-fg">Remember me</span>
    </label>
  );
}
