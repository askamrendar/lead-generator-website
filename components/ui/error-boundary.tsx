'use client';

import * as React from 'react';
import { TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Generic client error boundary. Wrap any dashboard section so a render failure in
 * one module degrades gracefully instead of blanking the shell. Provides a reset.
 */
interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}
interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error): void {
    // Kept minimal; a logging seam (T-001) can hook here later.
    console.error('[ErrorBoundary]', error);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-background p-8 text-center">
          <TriangleAlert className="size-8 text-red-600 dark:text-red-400" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-foreground">Something went wrong</p>
            <p className="mt-0.5 text-sm text-muted-fg">
              This section failed to load. Try again.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={this.reset}>
            Retry
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
