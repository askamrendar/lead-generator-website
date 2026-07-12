/** Analytics types. Independent module — reports only; never edits content/deploys. */

export interface MetricTile {
  key: string;
  label: string;
  value: number | string;
  hint?: string;
}

export interface TrendPoint {
  date: string; // YYYY-MM-DD
  value: number;
}

export interface ExternalSource {
  id: 'ga4' | 'search-console';
  name: string;
  configured: boolean;
  awaiting: boolean;
  message: string;
}

export interface HealthReport {
  score: number; // 0..100
  label: string;
  factors: { label: string; ok: boolean }[];
}

export interface AnalyticsSummary {
  scope: 'workspace' | 'website';
  rangeDays: number;
  /** Real internal metrics computed from the database. */
  tiles: MetricTile[];
  /** Deployment activity trend (real). */
  deploymentTrend: TrendPoint[];
  /** External providers (GA4 / Search Console) — awaiting credentials until Phase 10. */
  external: ExternalSource[];
  health: HealthReport;
}

export type Credentials = Record<string, string | undefined>;

/** External analytics provider contract (GA4, Search Console). */
export interface AnalyticsProvider {
  id: ExternalSource['id'];
  name: string;
  credentialKeys: string[];
  isConfigured(creds: Credentials): boolean;
  status(creds: Credentials): ExternalSource;
}
