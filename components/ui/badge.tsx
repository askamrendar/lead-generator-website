import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold',
  {
    variants: {
      variant: {
        brand: 'bg-brand/10 text-brand',
        accent: 'bg-accent/10 text-accent',
        muted: 'bg-muted text-muted-fg',
        outline: 'border border-border text-foreground',
      },
    },
    defaultVariants: { variant: 'brand' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
