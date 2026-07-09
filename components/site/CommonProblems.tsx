import { AlertTriangle, Check } from 'lucide-react';

interface Problem {
  problem: string;
  solution: string;
}

/** Problem → solution pairs. Good for "why choose us" and E-E-A-T signals. */
export function CommonProblems({ items }: { items: Problem[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <div
          key={item.problem}
          className="rounded-lg border border-border bg-background p-5"
        >
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="size-4 shrink-0 text-accent" />
            {item.problem}
          </div>
          <div className="mt-2 flex items-start gap-2 text-sm text-muted-fg">
            <Check className="mt-0.5 size-4 shrink-0 text-brand" />
            <span>{item.solution}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
