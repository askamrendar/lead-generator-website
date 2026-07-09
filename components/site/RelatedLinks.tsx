import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { LinkCluster } from '@/lib/generator/links';

/**
 * Renders the internal-link graph for a page as grouped clusters. Reusable
 * across every generated page type (service, city, county, ZIP, matrix, …).
 */
export function RelatedLinks({
  clusters,
  className,
}: {
  clusters: LinkCluster[];
  className?: string;
}) {
  if (clusters.length === 0) return null;
  return (
    <div className={className}>
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {clusters.map((cluster) => (
          <div key={cluster.title}>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-fg">
              {cluster.title}
            </h3>
            <ul className="space-y-2">
              {cluster.links.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="group inline-flex items-start gap-1 text-sm text-foreground hover:text-brand"
                  >
                    <span>
                      {link.label}
                      {link.sub && (
                        <span className="block text-xs text-muted-fg">
                          {link.sub}
                        </span>
                      )}
                    </span>
                    <ArrowUpRight className="size-3.5 shrink-0 translate-y-0.5 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
