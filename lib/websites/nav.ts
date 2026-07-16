import {
  LayoutDashboard,
  Paintbrush,
  Sparkles,
  FileText,
  Search,
  Rocket,
  Link2,
  Image,
  BarChart3,
  History,
  Settings,
  type LucideIcon,
} from 'lucide-react';

/**
 * Per-website navigation — config-driven, like the top-level dashboard nav. Every
 * future module (Builder, AI, Pages, SEO, Deployments, Domains, Media, Analytics,
 * Versions) already has its mount point here; `status: 'soon'` marks the ones whose
 * feature is a later milestone.
 */
export interface WebsiteNavItem {
  key: string;
  label: string;
  segment: string; // appended to /dashboard/websites/[id]
  icon: LucideIcon;
  status: 'ready' | 'soon';
  phase?: string;
}

export const WEBSITE_NAV: WebsiteNavItem[] = [
  { key: 'overview', label: 'Overview', segment: '', icon: LayoutDashboard, status: 'ready' },
  { key: 'builder', label: 'Builder', segment: 'builder', icon: Paintbrush, status: 'ready' },
  { key: 'ai', label: 'AI Generator', segment: 'ai-generator', icon: Sparkles, status: 'ready' },
  { key: 'pages', label: 'Pages', segment: 'pages', icon: FileText, status: 'ready' },
  { key: 'seo', label: 'SEO', segment: 'seo', icon: Search, status: 'ready' },
  { key: 'deployments', label: 'Deployments', segment: 'deployments', icon: Rocket, status: 'ready' },
  { key: 'domains', label: 'Domains', segment: 'domains', icon: Link2, status: 'ready' },
  { key: 'media', label: 'Media', segment: 'media', icon: Image, status: 'ready' },
  { key: 'analytics', label: 'Analytics', segment: 'analytics', icon: BarChart3, status: 'ready' },
  { key: 'versions', label: 'Versions', segment: 'versions', icon: History, status: 'ready' },
  { key: 'settings', label: 'Settings', segment: 'settings', icon: Settings, status: 'ready' },
];

export function websiteHref(websiteId: string, segment: string): string {
  const base = `/dashboard/websites/${websiteId}`;
  return segment ? `${base}/${segment}` : base;
}
