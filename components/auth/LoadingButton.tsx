import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { Button, type ButtonProps } from '@/components/ui/button';

/**
 * Button that shows a spinner and disables itself while `loading`. Extends the
 * shared Button (variants/sizes preserved). Announces busy state via `aria-busy`.
 */
export const LoadingButton = React.forwardRef<
  HTMLButtonElement,
  ButtonProps & { loading?: boolean; loadingText?: string }
>(({ loading = false, loadingText, children, disabled, ...props }, ref) => (
  <Button ref={ref} disabled={disabled || loading} aria-busy={loading} {...props}>
    {loading ? (
      <>
        <Loader2 className="size-4 animate-spin" aria-hidden />
        {loadingText ?? children}
      </>
    ) : (
      children
    )}
  </Button>
));
LoadingButton.displayName = 'LoadingButton';
