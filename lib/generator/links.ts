import { slugify } from '@/lib/utils';
import {
  citySlug,
  getCounties,
  getNearbyCities,
  getNearbyCounties,
  getNearbyZips,
  getServices,
  getStates,
  paths,
  type ResolvedCity,
  type ResolvedCounty,
  type ResolvedNeighborhood,
  type ResolvedService,
  type ResolvedState,
  type ResolvedZip,
} from '@/lib/generator/config';
import type { BusinessConfig } from '@/lib/generator/schema';

/**
 * Internal link engine.
 *
 * Turns the config's geography + services into a dense, deterministic link
 * graph. Every generated page calls one of the `*Links` builders below to get
 * grouped clusters of contextual links — related services, nearby areas, hubs —
 * so crawlers and users can traverse the entire site from any node.
 */

export interface LinkItem {
  label: string;
  href: string;
  sub?: string;
}

export interface LinkCluster {
  title: string;
  links: LinkItem[];
}

function serviceCluster(
  config: BusinessConfig,
  exceptSlug?: string,
  limit = 8,
): LinkCluster {
  return {
    title: 'Our Services',
    links: getServices(config)
      .filter((s) => s.slug !== exceptSlug)
      .slice(0, limit)
      .map((s) => ({ label: s.name, href: paths.service(s.slug) })),
  };
}

function nonEmpty(clusters: LinkCluster[]): LinkCluster[] {
  return clusters.filter((c) => c.links.length > 0);
}

/** Links for a top-level service page. */
export function serviceLinks(
  config: BusinessConfig,
  service: ResolvedService,
): LinkCluster[] {
  const services = getServices(config).filter((s) => s.slug !== service.slug);
  const cities = getStates(config).flatMap((state) =>
    state.cities.map((city) => ({ state, city: { ...city, slug: citySlug(city) } })),
  );
  return nonEmpty([
    {
      title: 'Related Services',
      links: services.slice(0, 6).map((s) => ({
        label: s.name,
        href: paths.service(s.slug),
      })),
    },
    {
      title: `${service.name} by City`,
      links: cities.slice(0, 8).map(({ state, city }) => ({
        label: `${service.name} in ${city.name}`,
        href: paths.serviceCity(service.slug, state.slug, city.slug),
        sub: `${city.name}, ${state.abbr}`,
      })),
    },
  ]);
}

/** Links for a city page. */
export function cityLinks(
  config: BusinessConfig,
  state: ResolvedState,
  city: ResolvedCity,
): LinkCluster[] {
  const nearby = getNearbyCities(config, state.slug, city.slug);
  const county = getCounties(config).find(
    (c) => c.state.slug === state.slug && c.name === city.county,
  );
  return nonEmpty([
    {
      title: `Services in ${city.name}`,
      links: getServices(config).map((s) => ({
        label: `${s.name} in ${city.name}`,
        href: paths.serviceCity(s.slug, state.slug, city.slug),
      })),
    },
    {
      title: 'Nearby Cities',
      links: nearby.map((c) => ({
        label: `${c.name}, ${state.abbr}`,
        href: paths.city(state.slug, c.slug),
        sub: c.county,
      })),
    },
    {
      title: 'Area Hubs',
      links: [
        { label: `${state.name} Service Area`, href: paths.stateHub(state.slug) },
        ...(county
          ? [
              {
                label: county.name,
                href: paths.county(state.slug, county.slug),
              },
            ]
          : []),
        ...city.zips
          .slice(0, 5)
          .map((zip) => ({ label: `ZIP ${zip}`, href: paths.zip(zip) })),
      ],
    },
  ]);
}

/** Links for a service × city matrix page. */
export function serviceCityLinks(
  config: BusinessConfig,
  service: ResolvedService,
  state: ResolvedState,
  city: ResolvedCity,
): LinkCluster[] {
  const nearby = getNearbyCities(config, state.slug, city.slug);
  return nonEmpty([
    {
      title: `${service.name} Nearby`,
      links: nearby.map((c) => ({
        label: `${service.name} in ${c.name}`,
        href: paths.serviceCity(service.slug, state.slug, c.slug),
        sub: `${c.name}, ${state.abbr}`,
      })),
    },
    {
      title: `Other Services in ${city.name}`,
      links: getServices(config)
        .filter((s) => s.slug !== service.slug)
        .map((s) => ({
          label: s.name,
          href: paths.serviceCity(s.slug, state.slug, city.slug),
        })),
    },
    {
      title: 'Explore',
      links: [
        { label: `All services in ${city.name}`, href: paths.city(state.slug, city.slug) },
        { label: `${state.name} service area`, href: paths.stateHub(state.slug) },
        { label: `About ${service.name}`, href: paths.service(service.slug) },
      ],
    },
  ]);
}

/** Links for a state hub page. */
export function stateLinks(
  config: BusinessConfig,
  state: ResolvedState,
): LinkCluster[] {
  const counties = getCounties(config).filter((c) => c.state.slug === state.slug);
  return nonEmpty([
    {
      title: 'Cities We Serve',
      links: state.cities.map((city) => ({
        label: `${city.name}, ${state.abbr}`,
        href: paths.city(state.slug, citySlug(city)),
      })),
    },
    {
      title: 'Counties',
      links: counties.map((c) => ({
        label: c.name,
        href: paths.county(state.slug, c.slug),
        sub: `${c.cities.length} ${c.cities.length === 1 ? 'city' : 'cities'}`,
      })),
    },
    serviceCluster(config),
  ]);
}

/** Links for a county hub page. */
export function countyLinks(
  config: BusinessConfig,
  county: ResolvedCounty,
): LinkCluster[] {
  const nearby = getNearbyCounties(config, county.state.slug, county.slug);
  return nonEmpty([
    {
      title: `Cities in ${county.name}`,
      links: county.cities.map((city) => ({
        label: `${city.name}, ${county.state.abbr}`,
        href: paths.city(county.state.slug, city.slug),
      })),
    },
    {
      title: 'Nearby Counties',
      links: nearby.map((c) => ({
        label: c.name,
        href: paths.county(c.state.slug, c.slug),
      })),
    },
    serviceCluster(config),
  ]);
}

/** Links for a ZIP page. */
export function zipLinks(config: BusinessConfig, target: ResolvedZip): LinkCluster[] {
  const nearby = getNearbyZips(config, target.zip);
  return nonEmpty([
    {
      title: `Services in ${target.zip}`,
      links: getServices(config).map((s) => ({
        label: `${s.name} in ${target.city.name}`,
        href: paths.serviceCity(s.slug, target.state.slug, target.city.slug),
      })),
    },
    {
      title: 'Nearby ZIP Codes',
      links: nearby.map((z) => ({
        label: `ZIP ${z.zip}`,
        href: paths.zip(z.zip),
        sub: z.city.name,
      })),
    },
    {
      title: 'Explore',
      links: [
        {
          label: `${target.city.name}, ${target.state.abbr}`,
          href: paths.city(target.state.slug, target.city.slug),
        },
        { label: `${target.state.name} service area`, href: paths.stateHub(target.state.slug) },
      ],
    },
  ]);
}

/** Links for a neighborhood page. */
export function neighborhoodLinks(
  config: BusinessConfig,
  n: ResolvedNeighborhood,
): LinkCluster[] {
  const siblings = n.city.neighborhoods.filter((name) => name !== n.name);
  return nonEmpty([
    {
      title: `Services in ${n.name}`,
      links: getServices(config).map((s) => ({
        label: `${s.name} in ${n.city.name}`,
        href: paths.serviceCity(s.slug, n.state.slug, n.city.slug),
      })),
    },
    {
      title: `Other ${n.city.name} Neighborhoods`,
      links: siblings.map((name) => ({
        label: name,
        href: paths.neighborhood(n.state.slug, n.city.slug, slugify(name)),
      })),
    },
    {
      title: 'Explore',
      links: [
        {
          label: `${n.city.name}, ${n.state.abbr}`,
          href: paths.city(n.state.slug, n.city.slug),
        },
        { label: `${n.state.name} service area`, href: paths.stateHub(n.state.slug) },
      ],
    },
  ]);
}
