import { cn } from '@/lib/utils';
import { themeCssVars } from '@/lib/builder/themes/css';
import { getTheme } from '@/lib/builder/themes/registry';
import type { ThemeId } from '@/lib/builder/types';

/**
 * Applies a theme's design tokens to its subtree via CSS variables. Any block
 * rendered inside inherits the theme's colors, radius, and font. Server
 * component — no flash, no client JS.
 */
export function ThemeProvider({
  themeId,
  className,
  children,
}: {
  themeId: ThemeId;
  className?: string;
  children: React.ReactNode;
}) {
  const theme = getTheme(themeId);
  return (
    <div
      data-theme={theme.id}
      style={themeCssVars(theme)}
      className={cn(
        'bg-background font-sans text-foreground',
        theme.dark && 'dark',
        className,
      )}
    >
      {children}
    </div>
  );
}
