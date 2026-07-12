import {
  LayoutDashboard,
  Globe,
  LayoutTemplate,
  Sparkles,
  Rocket,
  Link2,
  Image,
  KeyRound,
  Settings,
  HelpCircle,
  BarChart3,
  Activity,
  Bell,
  Star,
  Trash2,
  SlidersHorizontal,
  ListChecks,
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
      { label: 'Templates', href: '/dashboard/templates', icon: LayoutTemplate, status: 'ready' },
      { label: 'AI Generator', href: '/dashboard/ai-generator', icon: Sparkles, status: 'soon', phase: '7.2.4' },
    ],
  },
  {
    title: 'Workspace',
    items: [
      { label: 'Favorites', href: '/dashboard/favorites', icon: Star, status: 'ready' },
      { label: 'Prompt Library', href: '/dashboard/prompts', icon: Sparkles, status: 'ready' },
      { label: 'Trash', href: '/dashboard/trash', icon: Trash2, status: 'ready' },
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
      { label: 'Media Library', href: '/dashboard/media', icon: Image, status: 'ready' },
    ],
  },
  {
    title: 'Insights',
    items: [
      { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, status: 'ready' },
      { label: 'Task Center', href: '/dashboard/tasks', icon: ListChecks, status: 'ready' },
      { label: 'Background Jobs', href: '/dashboard/jobs', icon: Activity, status: 'ready' },
      { label: 'Notifications', href: '/dashboard/notifications', icon: Bell, status: 'ready' },
    ],
  },
  {
    title: 'Organization',
    items: [
      { label: 'API Keys', href: '/dashboard/api-keys', icon: KeyRound, status: 'soon', phase: '10' },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Preferences', href: '/dashboard/preferences', icon: SlidersHorizontal, status: 'ready' },
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
