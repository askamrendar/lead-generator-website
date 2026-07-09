import { slugify } from '@/lib/utils';
import type {
  BusinessConfig,
  City,
  Service,
  State,
} from '@/lib/generator/schema';

/**
 * Selectors + path builders over a BusinessConfig.
 *
 * These normalize slugs (deriving them from names when not provided) and give
 * every page a single, consistent way to resolve its data and its URLs.
 */

export type ResolvedService = Service & { slug: string };
export type ResolvedCity = City & { slug: string };
export type ResolvedState = State & { slug: string };

export function serviceSlug(service: Service): string {
  return service.slug ?? slugify(service.name);
}

export function citySlug(city: City): string {
  return city.slug ?? slugify(city.name);
}

export function stateSlug(state: State): string {
  return state.slug ?? slugify(state.name);
}

export function getServices(config: BusinessConfig): ResolvedService[] {
  return config.services.map((s) => ({ ...s, slug: serviceSlug(s) }));
}

export function getService(
  config: BusinessConfig,
  slug: string,
): ResolvedService | undefined {
  return getServices(config).find((s) => s.slug === slug);
}

export function getStates(config: BusinessConfig): ResolvedState[] {
  return config.states.map((state) => ({
    ...state,
    slug: stateSlug(state),
    cities: state.cities,
  }));
}

export function getCities(
  config: BusinessConfig,
): Array<{ state: ResolvedState; city: ResolvedCity }> {
  return getStates(config).flatMap((state) =>
    state.cities.map((city) => ({
      state,
      city: { ...city, slug: citySlug(city) },
    })),
  );
}

export function getCity(
  config: BusinessConfig,
  stateSlugParam: string,
  citySlugParam: string,
): { state: ResolvedState; city: ResolvedCity } | undefined {
  return getCities(config).find(
    ({ state, city }) =>
      state.slug === stateSlugParam && city.slug === citySlugParam,
  );
}

/** Cities in the same state, excluding the given one — used for "nearby areas". */
export function getNearbyCities(
  config: BusinessConfig,
  stateSlugParam: string,
  citySlugParam: string,
  limit = 6,
): ResolvedCity[] {
  return getCities(config)
    .filter(
      ({ state, city }) =>
        state.slug === stateSlugParam && city.slug !== citySlugParam,
    )
    .map(({ city }) => city)
    .slice(0, limit);
}

// --- Geo taxonomy: counties, ZIPs, neighborhoods -----------------------------

export interface ResolvedCounty {
  name: string;
  slug: string;
  state: ResolvedState;
  cities: ResolvedCity[];
}

export interface ResolvedZip {
  zip: string;
  state: ResolvedState;
  city: ResolvedCity;
}

export interface ResolvedNeighborhood {
  name: string;
  slug: string;
  state: ResolvedState;
  city: ResolvedCity;
}

/** Distinct counties across the config, each with the cities it contains. */
export function getCounties(config: BusinessConfig): ResolvedCounty[] {
  const map = new Map<string, ResolvedCounty>();
  for (const { state, city } of getCities(config)) {
    if (!city.county) continue;
    const key = `${state.slug}/${slugify(city.county)}`;
    const existing = map.get(key);
    if (existing) {
      existing.cities.push(city);
    } else {
      map.set(key, {
        name: city.county,
        slug: slugify(city.county),
        state,
        cities: [city],
      });
    }
  }
  return [...map.values()];
}

export function getCounty(
  config: BusinessConfig,
  stateSlugParam: string,
  countySlugParam: string,
): ResolvedCounty | undefined {
  return getCounties(config).find(
    (c) => c.state.slug === stateSlugParam && c.slug === countySlugParam,
  );
}

/** Every ZIP code in the config, mapped back to its city + state. */
export function getZips(config: BusinessConfig): ResolvedZip[] {
  const seen = new Set<string>();
  const out: ResolvedZip[] = [];
  for (const { state, city } of getCities(config)) {
    for (const zip of city.zips) {
      if (seen.has(zip)) continue;
      seen.add(zip);
      out.push({ zip, state, city });
    }
  }
  return out;
}

export function getZip(
  config: BusinessConfig,
  zip: string,
): ResolvedZip | undefined {
  return getZips(config).find((z) => z.zip === zip);
}

/** ZIPs geographically near a given ZIP (same city first, then same state). */
export function getNearbyZips(
  config: BusinessConfig,
  zip: string,
  limit = 6,
): ResolvedZip[] {
  const target = getZip(config, zip);
  if (!target) return [];
  const sameCity = getZips(config).filter(
    (z) => z.zip !== zip && z.city.slug === target.city.slug,
  );
  const sameState = getZips(config).filter(
    (z) =>
      z.zip !== zip &&
      z.city.slug !== target.city.slug &&
      z.state.slug === target.state.slug,
  );
  return [...sameCity, ...sameState].slice(0, limit);
}

/** Every neighborhood across the config, mapped to its city + state. */
export function getNeighborhoods(
  config: BusinessConfig,
): ResolvedNeighborhood[] {
  return getCities(config).flatMap(({ state, city }) =>
    city.neighborhoods.map((name) => ({
      name,
      slug: slugify(name),
      state,
      city,
    })),
  );
}

export function getNeighborhood(
  config: BusinessConfig,
  stateSlugParam: string,
  citySlugParam: string,
  neighborhoodSlugParam: string,
): ResolvedNeighborhood | undefined {
  return getNeighborhoods(config).find(
    (n) =>
      n.state.slug === stateSlugParam &&
      n.city.slug === citySlugParam &&
      n.slug === neighborhoodSlugParam,
  );
}

/** Nearby counties in the same state, excluding the given one. */
export function getNearbyCounties(
  config: BusinessConfig,
  stateSlugParam: string,
  countySlugParam: string,
  limit = 6,
): ResolvedCounty[] {
  return getCounties(config)
    .filter((c) => c.state.slug === stateSlugParam && c.slug !== countySlugParam)
    .slice(0, limit);
}

// --- Service × Location matrix ------------------------------------------------

export interface ServiceCityCombo {
  service: ResolvedService;
  state: ResolvedState;
  city: ResolvedCity;
}

/** The full service × city matrix — the engine behind the landing-page grid. */
export function getServiceCityMatrix(
  config: BusinessConfig,
): ServiceCityCombo[] {
  const services = getServices(config);
  return getCities(config).flatMap(({ state, city }) =>
    services.map((service) => ({ service, state, city })),
  );
}

export function getServiceCity(
  config: BusinessConfig,
  serviceSlugParam: string,
  stateSlugParam: string,
  citySlugParam: string,
): ServiceCityCombo | undefined {
  const service = getService(config, serviceSlugParam);
  const match = getCity(config, stateSlugParam, citySlugParam);
  if (!service || !match) return undefined;
  return { service, state: match.state, city: match.city };
}

// --- URL builders ------------------------------------------------------------

export const paths = {
  home: () => '/',
  about: () => '/about',
  contact: () => '/contact',
  services: () => '/services',
  service: (slug: string) => `/services/${slug}`,
  locations: () => '/locations',
  stateHub: (stateSlugParam: string) => `/locations/${stateSlugParam}`,
  city: (stateSlugParam: string, citySlugParam: string) =>
    `/locations/${stateSlugParam}/${citySlugParam}`,
  neighborhood: (
    stateSlugParam: string,
    citySlugParam: string,
    neighborhoodSlugParam: string,
  ) => `/locations/${stateSlugParam}/${citySlugParam}/${neighborhoodSlugParam}`,
  county: (stateSlugParam: string, countySlugParam: string) =>
    `/locations/${stateSlugParam}/county/${countySlugParam}`,
  zip: (zip: string) => `/locations/zip/${zip}`,
  /** Service × city landing page (the SEO matrix). */
  serviceCity: (
    serviceSlugParam: string,
    stateSlugParam: string,
    citySlugParam: string,
  ) => `/services/${serviceSlugParam}/${stateSlugParam}/${citySlugParam}`,
  generate: () => '/generate',
};

/** Absolute URL against the config's canonical origin. */
export function absoluteUrl(config: BusinessConfig, path: string): string {
  const base = config.siteUrl.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

/** All routable paths — used by sitemap generation. */
export function getAllPaths(config: BusinessConfig): string[] {
  const staticPaths = [
    paths.home(),
    paths.about(),
    paths.contact(),
    paths.services(),
    paths.locations(),
  ];
  const servicePaths = getServices(config).map((s) => paths.service(s.slug));
  const stateHubPaths = getStates(config).map((s) => paths.stateHub(s.slug));
  const cityPaths = getCities(config).map(({ state, city }) =>
    paths.city(state.slug, city.slug),
  );
  const countyPaths = getCounties(config).map((c) =>
    paths.county(c.state.slug, c.slug),
  );
  const zipPaths = getZips(config).map((z) => paths.zip(z.zip));
  const neighborhoodPaths = getNeighborhoods(config).map((n) =>
    paths.neighborhood(n.state.slug, n.city.slug, n.slug),
  );
  const matrixPaths = getServiceCityMatrix(config).map(({ service, state, city }) =>
    paths.serviceCity(service.slug, state.slug, city.slug),
  );
  return [
    ...staticPaths,
    ...servicePaths,
    ...stateHubPaths,
    ...cityPaths,
    ...countyPaths,
    ...zipPaths,
    ...neighborhoodPaths,
    ...matrixPaths,
  ];
}

/** Human-readable full address on one line. */
export function formatAddress(config: BusinessConfig): string {
  const a = config.address;
  return `${a.street}, ${a.city}, ${a.stateAbbr} ${a.zip}`;
}

/** A short "serving X, Y and Z" string from the configured cities. */
export function serviceAreaSummary(config: BusinessConfig, limit = 4): string {
  const names = getCities(config)
    .map(({ city }) => city.name)
    .slice(0, limit);
  if (names.length <= 1) return names[0] ?? config.address.city;
  const last = names.pop();
  return `${names.join(', ')} and ${last}`;
}
