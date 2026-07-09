import type { Metadata } from 'next';
import Link from 'next/link';
import { business } from '@/data/business';
import {
  getCities,
  getServiceCityMatrix,
  getServices,
} from '@/lib/generator/config';
import {
  buildAboutContext,
  buildCityContext,
  buildHomeContext,
  buildServiceCityContext,
  buildServiceContext,
} from '@/lib/ai/context';
import { resolvePageContent } from '@/lib/ai/render';
import type { PageContext, PageType } from '@/lib/ai/types';
import type { ThemeId } from '@/lib/builder/types';
import { selectBuild } from '@/lib/builder/select';
import { composePage } from '@/lib/builder/compose';
import { buildBlockContext } from '@/lib/builder/context';
import { listTemplates } from '@/templates/registry';
import { listThemes } from '@/lib/builder/themes/registry';
import { listIndustries } from '@/lib/builder/industries';
import { registrySummary } from '@/lib/builder/registry';
import { ThemeProvider } from '@/components/builder/ThemeProvider';
import { BlockRenderer } from '@/components/builder/BlockRenderer';
import { cn } from '@/lib/utils';

// Internal demo surface — not for indexing.
export const metadata: Metadata = {
  title: 'Website Builder Preview',
  robots: { index: false, follow: false },
};

const PREVIEWABLE: PageType[] = ['home', 'about', 'service', 'city', 'serviceCity'];

/** Resolve a demo PageContext for the requested page type (first entity). */
function demoContext(pageType: PageType): PageContext {
  switch (pageType) {
    case 'about':
      return buildAboutContext(business);
    case 'service': {
      const s = getServices(business)[0];
      return buildServiceContext(business, s.slug) ?? buildHomeContext(business);
    }
    case 'city': {
      const { state, city } = getCities(business)[0];
      return (
        buildCityContext(business, state.slug, city.slug) ??
        buildHomeContext(business)
      );
    }
    case 'serviceCity': {
      const { service, state, city } = getServiceCityMatrix(business)[0];
      return (
        buildServiceCityContext(business, service.slug, state.slug, city.slug) ??
        buildHomeContext(business)
      );
    }
    case 'home':
    default:
      return buildHomeContext(business);
  }
}

function qs(params: Record<string, string>): string {
  return '?' + new URLSearchParams(params).toString();
}

export default async function BuilderPreviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

  const pageType = (PREVIEWABLE.includes(one(sp.page) as PageType)
    ? (one(sp.page) as PageType)
    : 'home') as PageType;

  const selection = selectBuild(business, {
    templateId: one(sp.template),
    themeId: one(sp.theme) as ThemeId | undefined,
    industryId: one(sp.industry),
  });
  const { template, themeId, industry } = selection;

  const pageCtx = demoContext(pageType);
  const { content, source } = await resolvePageContent(pageCtx);
  const blockCtx = buildBlockContext(pageCtx, content, themeId, industry.id);
  const page = composePage(template, pageType);
  const summary = registrySummary();

  const base = {
    template: template.id,
    theme: themeId,
    industry: industry.id,
    page: pageType,
  };

  return (
    <div>
      {/* Control bar (outside the themed subtree) */}
      <div className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 text-neutral-800 backdrop-blur">
        <div className="container flex flex-wrap items-center gap-x-6 gap-y-2 py-3 text-sm">
          <span className="font-bold">Website Builder</span>
          <ControlGroup
            label="Template"
            current={template.id}
            options={listTemplates().map((t) => t.id)}
            build={(v) => qs({ ...base, template: v })}
          />
          <ControlGroup
            label="Theme"
            current={themeId}
            options={listThemes().map((t) => t.id)}
            build={(v) => qs({ ...base, theme: v })}
          />
          <ControlGroup
            label="Industry"
            current={industry.id}
            options={listIndustries().map((p) => p.id)}
            build={(v) => qs({ ...base, industry: v })}
          />
          <ControlGroup
            label="Page"
            current={pageType}
            options={PREVIEWABLE}
            build={(v) => qs({ ...base, page: v })}
          />
          <span className="ml-auto text-xs text-neutral-500">
            {summary.sections} blocks · {summary.themes} themes ·{' '}
            {summary.templates} templates · {summary.industries} industries ·
            content: {source} · {page.blocks.length} blocks on page
          </span>
        </div>
      </div>

      {/* The generated, block-driven, themed page */}
      <ThemeProvider themeId={themeId}>
        <BlockRenderer page={page} ctx={blockCtx} />
      </ThemeProvider>
    </div>
  );
}

function ControlGroup({
  label,
  current,
  options,
  build,
}: {
  label: string;
  current: string;
  options: string[];
  build: (value: string) => string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-semibold uppercase text-neutral-400">
        {label}
      </span>
      {options.map((opt) => (
        <Link
          key={opt}
          href={`/preview${build(opt)}`}
          className={cn(
            'rounded px-2 py-0.5 text-xs',
            opt === current
              ? 'bg-neutral-900 text-white'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200',
          )}
        >
          {opt}
        </Link>
      ))}
    </div>
  );
}
