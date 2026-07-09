'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FaqItem {
  question: string;
  answer: string;
}

/** Accessible accordion FAQ. Pair with faqSchema() for the JSON-LD. */
export function FAQ({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-3xl divide-y divide-border rounded-lg border border-border">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.question}>
            <button
              className="flex w-full items-center justify-between gap-4 p-5 text-left"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : i)}
            >
              <span className="font-semibold">{item.question}</span>
              <ChevronDown
                className={cn(
                  'size-5 shrink-0 text-muted-fg transition-transform',
                  isOpen && 'rotate-180',
                )}
              />
            </button>
            <div
              className={cn(
                'grid overflow-hidden px-5 transition-all',
                isOpen ? 'grid-rows-[1fr] pb-5' : 'grid-rows-[0fr]',
              )}
            >
              <p className="overflow-hidden text-muted-fg">{item.answer}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
