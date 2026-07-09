import * as React from 'react';

/**
 * Minimal `Slot` — merges its props (including className) onto its single child
 * element. Lets `<Button asChild><Link/></Button>` render an anchor with button
 * styling, without pulling in @radix-ui/react-slot.
 */
export interface SlotProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

export const Slot = React.forwardRef<HTMLElement, SlotProps>(
  ({ children, ...props }, ref) => {
    if (!React.isValidElement(children)) {
      return null;
    }

    const child = children as React.ReactElement<Record<string, unknown>>;
    const childProps = child.props;

    const mergedClassName = [props.className, childProps.className as string]
      .filter(Boolean)
      .join(' ');

    return React.cloneElement(child, {
      ...props,
      ...childProps,
      className: mergedClassName || undefined,
      ref,
    });
  },
);
Slot.displayName = 'Slot';
