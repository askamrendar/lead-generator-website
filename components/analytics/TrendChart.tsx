import * as React from 'react';
import type { TrendPoint } from '@/lib/analytics/types';

/**
 * Lightweight dependency-free SVG bar chart for a metric trend. Presentational; the
 * caller supplies real data points. Accessible via an aria summary.
 */
export function TrendChart({ points, label }: { points: TrendPoint[]; label: string }) {
  const max = Math.max(1, ...points.map((p) => p.value));
  const total = points.reduce((s, p) => s + p.value, 0);
  const w = 100;
  const gap = 1.5;
  const barW = points.length > 0 ? (w - gap * (points.length - 1)) / points.length : w;

  return (
    <figure role="img" aria-label={`${label}: ${total} over ${points.length} days`}>
      <svg viewBox={`0 0 ${w} 40`} preserveAspectRatio="none" className="h-28 w-full">
        {points.map((p, i) => {
          const h = (p.value / max) * 36;
          return (
            <rect
              key={p.date}
              x={i * (barW + gap)}
              y={40 - h}
              width={barW}
              height={Math.max(h, 0.5)}
              rx={0.6}
              className="fill-brand/70"
            >
              <title>{`${p.date}: ${p.value}`}</title>
            </rect>
          );
        })}
      </svg>
      <figcaption className="mt-1 flex justify-between text-[10px] text-muted-fg">
        <span>{points[0]?.date}</span>
        <span>{points[points.length - 1]?.date}</span>
      </figcaption>
    </figure>
  );
}
