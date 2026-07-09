import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface Crumb {
  name: string;
  path: string;
}

/** Visual breadcrumb trail. Pair with breadcrumbSchema() for the JSON-LD. */
export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted-fg">
      <ol className="flex flex-wrap items-center gap-1">
        {crumbs.map((crumb, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={crumb.path} className="flex items-center gap-1">
              {last ? (
                <span aria-current="page" className="text-foreground">
                  {crumb.name}
                </span>
              ) : (
                <Link href={crumb.path} className="hover:text-brand">
                  {crumb.name}
                </Link>
              )}
              {!last && <ChevronRight className="size-3.5" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
