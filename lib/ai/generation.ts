import {
  getCities,
  getCounties,
  getNeighborhoods,
  getServiceCityMatrix,
  getServices,
  getStates,
  getZips,
} from '@/lib/generator/config';
import type { BusinessConfig } from '@/lib/generator/schema';
import {
  buildAboutContext,
  buildCityContext,
  buildCountyContext,
  buildHomeContext,
  buildNeighborhoodContext,
  buildServiceCityContext,
  buildServiceContext,
  buildStateContext,
  buildZipContext,
} from '@/lib/ai/context';
import { generatePageContent } from '@/lib/ai/services/content-service';
import { archiveCurrent } from '@/lib/ai/versioning';
import { contentKey, getCacheStore } from '@/lib/ai/cache';
import { PROMPT_LIBRARY_VERSION } from '@/lib/ai/prompts';
import { createLimiter } from '@/lib/ai/services/rate-limit';
import type { PageContext } from '@/lib/ai/types';

/**
 * Admin / batch generation utilities.
 *
 * Enumerate the pages the config produces and (re)generate their content into
 * the cache. Used by `/api/ai/batch` and the pre-generation script. Concurrency
 * is bounded; provider calls inside the content service are additionally limited.
 */

export type GenerationScope =
  | 'website'
  | 'services'
  | 'cities'
  | 'states'
  | 'counties'
  | 'zips'
  | 'neighborhoods'
  | 'matrix'
  | 'core';

function compact(ctxs: Array<PageContext | undefined>): PageContext[] {
  return ctxs.filter((c): c is PageContext => Boolean(c));
}

export function coreContexts(config: BusinessConfig): PageContext[] {
  return [buildHomeContext(config), buildAboutContext(config)];
}

export function serviceContexts(config: BusinessConfig): PageContext[] {
  return compact(
    getServices(config).map((s) => buildServiceContext(config, s.slug)),
  );
}

export function cityContexts(config: BusinessConfig): PageContext[] {
  return compact(
    getCities(config).map(({ state, city }) =>
      buildCityContext(config, state.slug, city.slug),
    ),
  );
}

export function stateContexts(config: BusinessConfig): PageContext[] {
  return compact(getStates(config).map((s) => buildStateContext(config, s.slug)));
}

export function countyContexts(config: BusinessConfig): PageContext[] {
  return compact(
    getCounties(config).map((c) =>
      buildCountyContext(config, c.state.slug, c.slug),
    ),
  );
}

export function zipContexts(config: BusinessConfig): PageContext[] {
  return compact(getZips(config).map((z) => buildZipContext(config, z.zip)));
}

export function neighborhoodContexts(config: BusinessConfig): PageContext[] {
  return compact(
    getNeighborhoods(config).map((n) =>
      buildNeighborhoodContext(config, n.state.slug, n.city.slug, n.slug),
    ),
  );
}

export function matrixContexts(config: BusinessConfig): PageContext[] {
  return compact(
    getServiceCityMatrix(config).map(({ service, state, city }) =>
      buildServiceCityContext(config, service.slug, state.slug, city.slug),
    ),
  );
}

/** All contexts for the whole site. */
export function allContexts(config: BusinessConfig): PageContext[] {
  return [
    ...coreContexts(config),
    ...serviceContexts(config),
    ...stateContexts(config),
    ...cityContexts(config),
    ...countyContexts(config),
    ...zipContexts(config),
    ...neighborhoodContexts(config),
    ...matrixContexts(config),
  ];
}

export function contextsForScope(
  config: BusinessConfig,
  scope: GenerationScope,
): PageContext[] {
  switch (scope) {
    case 'website':
      return allContexts(config);
    case 'core':
      return coreContexts(config);
    case 'services':
      return serviceContexts(config);
    case 'cities':
      return cityContexts(config);
    case 'states':
      return stateContexts(config);
    case 'counties':
      return countyContexts(config);
    case 'zips':
      return zipContexts(config);
    case 'neighborhoods':
      return neighborhoodContexts(config);
    case 'matrix':
      return matrixContexts(config);
    default:
      return [];
  }
}

export interface GenerationSummary {
  total: number;
  ai: number;
  fallback: number;
  errors: number;
  byType: Record<string, number>;
  durationMs: number;
}

export interface GenerateBatchOptions {
  regenerate?: boolean;
  /** Cap the number of pages processed (safety valve). */
  limit?: number;
  concurrency?: number;
}

/** Generate content for a set of contexts, returning a summary. */
export async function generateForContexts(
  contexts: PageContext[],
  opts: GenerateBatchOptions = {},
): Promise<GenerationSummary> {
  const start = Date.now();
  const list = opts.limit ? contexts.slice(0, opts.limit) : contexts;
  const limiter = createLimiter({ concurrency: opts.concurrency ?? 4 });
  const byType: Record<string, number> = {};
  let ai = 0;
  let fallback = 0;
  let errors = 0;

  await Promise.all(
    list.map((ctx) =>
      limiter.run(async () => {
        try {
          if (opts.regenerate) {
            await archiveCurrent(contentKey(ctx, PROMPT_LIBRARY_VERSION));
          }
          const res = await generatePageContent(ctx, {
            regenerate: opts.regenerate,
          });
          byType[ctx.pageType] = (byType[ctx.pageType] ?? 0) + 1;
          if (res.meta.fallback) fallback++;
          else ai++;
        } catch {
          errors++;
        }
      }),
    ),
  );

  return {
    total: list.length,
    ai,
    fallback,
    errors,
    byType,
    durationMs: Date.now() - start,
  };
}

/** Generate the whole website (or a scope) into the cache. */
export async function generateWebsite(
  config: BusinessConfig,
  scope: GenerationScope = 'website',
  opts: GenerateBatchOptions = {},
): Promise<GenerationSummary> {
  return generateForContexts(contextsForScope(config, scope), opts);
}

/** Snapshot of cache contents for status/browser endpoints. */
export async function cacheSnapshot(): Promise<
  Array<{
    key: string;
    pageType: string;
    path: string;
    provider: string;
    model: string;
    status?: string;
    createdAt: string;
  }>
> {
  const store = getCacheStore();
  const keys = await store.keys();
  const entries = await Promise.all(keys.map((k) => store.get(k)));
  return entries
    .filter(Boolean)
    .map((e) => ({
      key: e!.key,
      pageType: e!.pageType,
      path: e!.path,
      provider: e!.provider,
      model: e!.model,
      status: e!.status,
      createdAt: e!.createdAt,
    }));
}
