import {
  User,
  Building2,
  Layers,
  Sparkles,
  Rocket,
  Link2,
  Bell,
  SlidersHorizontal,
  Shield,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';

/** Config-driven settings sections (single source for the settings sub-nav). */
export interface SettingsNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const SETTINGS_NAV: SettingsNavItem[] = [
  { label: 'Profile', href: '/dashboard/settings', icon: User },
  { label: 'Organization', href: '/dashboard/settings/organization', icon: Building2 },
  { label: 'Workspace', href: '/dashboard/settings/workspace', icon: Layers },
  { label: 'AI Providers', href: '/dashboard/settings/ai-providers', icon: Sparkles },
  { label: 'Deployment Providers', href: '/dashboard/settings/deployment-providers', icon: Rocket },
  { label: 'Domains', href: '/dashboard/settings/domains', icon: Link2 },
  { label: 'Notifications', href: '/dashboard/settings/notifications', icon: Bell },
  { label: 'Preferences', href: '/dashboard/settings/preferences', icon: SlidersHorizontal },
  { label: 'Security', href: '/dashboard/settings/security', icon: Shield },
  { label: 'Danger Zone', href: '/dashboard/settings/danger-zone', icon: TriangleAlert },
];
