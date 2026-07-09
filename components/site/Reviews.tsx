import { Star, Quote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { Review } from '@/lib/generator/schema';

export function Reviews({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null;
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {reviews.map((r) => (
        <Card key={`${r.author}-${r.body.slice(0, 12)}`} className="h-full">
          <CardContent className="flex h-full flex-col p-6">
            <Quote className="size-6 text-brand/30" />
            <div className="mt-2 flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={
                    i < r.rating
                      ? 'size-4 fill-accent text-accent'
                      : 'size-4 text-border'
                  }
                />
              ))}
            </div>
            <p className="mt-3 flex-1 text-sm text-foreground">
              &ldquo;{r.body}&rdquo;
            </p>
            <div className="mt-4 text-sm">
              <span className="font-semibold">{r.author}</span>
              {r.location && (
                <span className="text-muted-fg"> · {r.location}</span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
