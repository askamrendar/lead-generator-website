import { Hero } from '@/components/site/Hero';
import { Stats } from '@/components/site/Stats';
import { StatBar } from '@/components/site/StatBar';
import { Reviews } from '@/components/site/Reviews';
import { FAQ } from '@/components/site/FAQ';
import { CTASection } from '@/components/site/CTASection';
import { ServiceCard } from '@/components/site/ServiceCard';
import { LocationCard } from '@/components/site/LocationCard';
import { LeadForm } from '@/components/site/LeadForm';
import { MapEmbed } from '@/components/site/MapEmbed';
import { EmergencyCTA } from '@/components/site/EmergencyCTA';
import { CommonProblems } from '@/components/site/CommonProblems';
import { RelatedLinks } from '@/components/site/RelatedLinks';
import { SectionHeading } from '@/components/site/SectionHeading';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

/**
 * Component registry — a named catalog of the reusable UI primitives the block
 * layer composes from. Useful for tooling, a future visual editor, and to keep
 * a single source of truth for "what components exist".
 */
export const componentRegistry = {
  Hero,
  Stats,
  StatBar,
  Reviews,
  FAQ,
  CTASection,
  ServiceCard,
  LocationCard,
  LeadForm,
  MapEmbed,
  EmergencyCTA,
  CommonProblems,
  RelatedLinks,
  SectionHeading,
  Button,
  Card,
  Badge,
  Input,
  Textarea,
  Label,
} as const;

export function listComponents(): string[] {
  return Object.keys(componentRegistry);
}
