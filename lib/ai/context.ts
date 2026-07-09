import {
  getCity,
  getCounty,
  getNeighborhood,
  getService,
  getServiceCity,
  getStates,
  getZip,
  paths,
} from '@/lib/generator/config';
import type { BusinessConfig } from '@/lib/generator/schema';
import type { PageContext } from '@/lib/ai/types';

/**
 * Context builders. Each resolves the relevant entities from the config and
 * produces the PageContext an agent needs. Returns undefined when the requested
 * entity doesn't exist, so callers can 404 cleanly.
 */

export function buildHomeContext(config: BusinessConfig): PageContext {
  return {
    pageType: 'home',
    business: config,
    path: paths.home(),
    title: config.name,
    placeName: `${config.address.city}, ${config.address.stateAbbr}`,
  };
}

export function buildAboutContext(config: BusinessConfig): PageContext {
  return {
    pageType: 'about',
    business: config,
    path: paths.about(),
    title: `About ${config.name}`,
    placeName: `${config.address.city}, ${config.address.stateAbbr}`,
  };
}

export function buildServiceContext(
  config: BusinessConfig,
  serviceSlug: string,
): PageContext | undefined {
  const service = getService(config, serviceSlug);
  if (!service) return undefined;
  return {
    pageType: 'service',
    business: config,
    service,
    path: paths.service(service.slug),
    title: service.name,
    placeName: `${config.address.city}, ${config.address.stateAbbr}`,
  };
}

export function buildStateContext(
  config: BusinessConfig,
  stateSlug: string,
): PageContext | undefined {
  const state = getStates(config).find((s) => s.slug === stateSlug);
  if (!state) return undefined;
  return {
    pageType: 'state',
    business: config,
    state,
    path: paths.stateHub(state.slug),
    title: state.name,
    placeName: state.name,
  };
}

export function buildCityContext(
  config: BusinessConfig,
  stateSlug: string,
  citySlug: string,
): PageContext | undefined {
  const match = getCity(config, stateSlug, citySlug);
  if (!match) return undefined;
  return {
    pageType: 'city',
    business: config,
    state: match.state,
    city: match.city,
    path: paths.city(match.state.slug, match.city.slug),
    title: `${match.city.name}, ${match.state.abbr}`,
    placeName: `${match.city.name}, ${match.state.abbr}`,
  };
}

export function buildCountyContext(
  config: BusinessConfig,
  stateSlug: string,
  countySlug: string,
): PageContext | undefined {
  const county = getCounty(config, stateSlug, countySlug);
  if (!county) return undefined;
  return {
    pageType: 'county',
    business: config,
    state: county.state,
    county,
    path: paths.county(county.state.slug, county.slug),
    title: county.name,
    placeName: county.name,
  };
}

export function buildNeighborhoodContext(
  config: BusinessConfig,
  stateSlug: string,
  citySlug: string,
  neighborhoodSlug: string,
): PageContext | undefined {
  const n = getNeighborhood(config, stateSlug, citySlug, neighborhoodSlug);
  if (!n) return undefined;
  return {
    pageType: 'neighborhood',
    business: config,
    state: n.state,
    city: n.city,
    neighborhood: n,
    path: paths.neighborhood(n.state.slug, n.city.slug, n.slug),
    title: `${n.name}, ${n.city.name}`,
    placeName: `${n.name}, ${n.city.name}`,
  };
}

export function buildZipContext(
  config: BusinessConfig,
  zip: string,
): PageContext | undefined {
  const target = getZip(config, zip);
  if (!target) return undefined;
  return {
    pageType: 'zip',
    business: config,
    state: target.state,
    city: target.city,
    zip: target,
    path: paths.zip(target.zip),
    title: `${target.zip} — ${target.city.name}`,
    placeName: `${target.zip} (${target.city.name}, ${target.state.abbr})`,
  };
}

export function buildServiceCityContext(
  config: BusinessConfig,
  serviceSlug: string,
  stateSlug: string,
  citySlug: string,
): PageContext | undefined {
  const combo = getServiceCity(config, serviceSlug, stateSlug, citySlug);
  if (!combo) return undefined;
  return {
    pageType: 'serviceCity',
    business: config,
    service: combo.service,
    state: combo.state,
    city: combo.city,
    path: paths.serviceCity(combo.service.slug, combo.state.slug, combo.city.slug),
    title: `${combo.service.name} in ${combo.city.name}, ${combo.state.abbr}`,
    placeName: `${combo.city.name}, ${combo.state.abbr}`,
  };
}

/** Dispatch a page type + string params to the right context builder. */
export function buildContext(
  config: BusinessConfig,
  pageType: string,
  params: Record<string, string> = {},
): PageContext | undefined {
  switch (pageType) {
    case 'home':
      return buildHomeContext(config);
    case 'about':
      return buildAboutContext(config);
    case 'service':
      return buildServiceContext(config, params.serviceSlug ?? '');
    case 'state':
      return buildStateContext(config, params.stateSlug ?? '');
    case 'city':
      return buildCityContext(config, params.stateSlug ?? '', params.citySlug ?? '');
    case 'county':
      return buildCountyContext(config, params.stateSlug ?? '', params.countySlug ?? '');
    case 'neighborhood':
      return buildNeighborhoodContext(
        config,
        params.stateSlug ?? '',
        params.citySlug ?? '',
        params.neighborhoodSlug ?? '',
      );
    case 'zip':
      return buildZipContext(config, params.zip ?? '');
    case 'serviceCity':
      return buildServiceCityContext(
        config,
        params.serviceSlug ?? '',
        params.stateSlug ?? '',
        params.citySlug ?? '',
      );
    default:
      return undefined;
  }
}
