import {
  LayoutDashboard,
  Globe,
  LayoutTemplate,
  Sparkles,
  Rocket,
  Link2,
  Image,
  Users,
  KeyRound,
  Settings,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react';

/**
 * Config-driven dashboard navigation — the single source for the sidebar. Every
 * future module registers itself by adding an item here (and its route); the shell
 * renders from this config, so nothing is hard-coded. `status: 'soon'` marks routes
 * whose feature is not built yet (placeholder pages).
 */

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** 'ready' = usable now; 'soon' = placeholder page for a future milestone. */
  status: 'ready' | 'soon';
  /** Milestone that will implement a 'soon' route (shown as a hint). */
  phase?: string;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export const DASHBOARD_NAV: NavSection[] = [
  {
    items: [{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, status: 'ready' }],
  },
  {
    title: 'Build',
    items: [
      { label: 'Websites', href: '/dashboard/websites', icon: Globe, status: 'soon', phase: '7.2.3' },
      { label: 'Templates', href: '/dashboard/templates', icon: LayoutTemplate, status: 'soon', phase: '7.2.3' },
      { label: 'AI Generator', href: '/dashboard/ai-generator', icon: Sparkles, status: 'soon', phase: '7.2.4' },
    ],
  },
  {
    title: 'Publish',
    items: [
      { label: 'Deployments', href: '/dashboard/deployments', icon: Rocket, status: 'soon', phase: '8' },
      { label: 'Domains', href: '/dashboard/domains', icon: Link2, status: 'soon', phase: '8.5' },
    ],
  },
  {
    title: 'Assets',
    items: [
      { label: 'Media Library', href: '/dashboard/media', icon: Image, status: 'soon', phase: '8.6' },
    ],
  },
  {
    title: 'Organization',
    items: [
      { label: 'Team', href: '/dashboard/team', icon: Users, status: 'soon', phase: '9' },
      { label: 'API Keys', href: '/dashboard/api-keys', icon: KeyRound, status: 'soon', phase: 'later' },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Settings', href: '/dashboard/settings', icon: Settings, status: 'soon', phase: '7.2.2+' },
      { label: 'Help', href: '/dashboard/help', icon: HelpCircle, status: 'ready' },
    ],
  },
];

/** Flat list (for breadcrumb label lookup, search, etc.). */
export const NAV_ITEMS: NavItem[] = DASHBOARD_NAV.flatMap((s) => s.items);

/** Best-effort human label for a dashboard path segment. */
export function labelForHref(href: string): string | undefined {
  return NAV_ITEMS.find((i) => i.href === href)?.label;
}
