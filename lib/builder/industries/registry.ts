import type { IndustryPack } from '@/lib/builder/types';

/**
 * Industry packs. Each pack encodes the domain knowledge for a vertical:
 * services, terminology, FAQs, schema type, image keywords, blog categories,
 * prompt hints, and default theme/template. A business config can be built from
 * (or validated against) a pack, and the AI prompts + schema adapt per industry.
 *
 * Five packs ship here; adding another vertical is a single object.
 */

const plumbing: IndustryPack = {
  id: 'plumbing',
  name: 'Plumbing',
  category: 'Plumbing',
  schemaType: 'Plumber',
  terminology: {
    professional: 'plumber',
    service: 'plumbing service',
    emergencyName: 'emergency plumbing',
  },
  services: [
    { name: 'Drain Cleaning', shortDescription: 'Clear clogged and slow drains fast.', startingPrice: '$99' },
    { name: 'Water Heater Repair & Installation', shortDescription: 'Tank and tankless water heater service.', startingPrice: '$149' },
    { name: 'Emergency Plumbing', shortDescription: '24/7 response for burst pipes and major leaks.', emergency: true },
    { name: 'Leak Detection & Repair', shortDescription: 'Find and stop hidden leaks before damage spreads.' },
    { name: 'Sewer Line Repair', shortDescription: 'Trenchless sewer repair and replacement.' },
    { name: 'Faucet & Fixture Installation', shortDescription: 'Clean, code-compliant fixture upgrades.' },
  ],
  faqs: [
    { question: 'Do you offer emergency plumbing?', answer: 'Yes — 24/7 emergency response for burst pipes, major leaks, and overflows.' },
    { question: 'Are your plumbers licensed?', answer: 'Every plumber is licensed, insured, and background-checked.' },
  ],
  imageKeywords: ['plumber', 'pipe repair', 'water heater', 'drain', 'wrench'],
  blogCategories: ['Drains', 'Water Heaters', 'Leaks', 'Maintenance Tips'],
  promptHints: 'Emphasize fast emergency response, water-damage prevention, and upfront flat-rate pricing.',
  defaultThemeId: 'blue-collar',
  defaultTemplateId: 'plumber',
};

const hvac: IndustryPack = {
  id: 'hvac',
  name: 'HVAC',
  category: 'HVAC',
  schemaType: 'HVACBusiness',
  terminology: {
    professional: 'HVAC technician',
    service: 'HVAC service',
    emergencyName: 'emergency HVAC repair',
  },
  services: [
    { name: 'AC Repair', shortDescription: 'Fast air-conditioning diagnosis and repair.', startingPrice: '$89' },
    { name: 'AC Installation', shortDescription: 'Efficient new AC systems, professionally installed.' },
    { name: 'Furnace Repair', shortDescription: 'Heating repair to keep you warm all winter.', startingPrice: '$99' },
    { name: 'Furnace Installation', shortDescription: 'High-efficiency furnace replacement.' },
    { name: 'Heat Pump Service', shortDescription: 'Install, repair, and tune-up heat pumps.' },
    { name: 'Emergency HVAC Repair', shortDescription: '24/7 heating and cooling emergencies.', emergency: true },
  ],
  faqs: [
    { question: 'How often should I service my HVAC?', answer: 'Twice a year — a spring AC tune-up and a fall furnace check — keeps systems efficient and reliable.' },
    { question: 'Do you offer financing on new systems?', answer: 'Yes, flexible financing is available on qualifying installations.' },
  ],
  imageKeywords: ['hvac technician', 'air conditioner', 'furnace', 'thermostat', 'heat pump'],
  blogCategories: ['Cooling', 'Heating', 'Efficiency', 'Indoor Air Quality'],
  promptHints: 'Emphasize comfort, energy efficiency, seasonal tune-ups, and financing on installs.',
  defaultThemeId: 'corporate',
  defaultTemplateId: 'hvac',
};

const roofing: IndustryPack = {
  id: 'roofing',
  name: 'Roofing',
  category: 'Roofing',
  schemaType: 'RoofingContractor',
  terminology: {
    professional: 'roofer',
    service: 'roofing service',
    emergencyName: 'emergency roof repair',
  },
  services: [
    { name: 'Roof Repair', shortDescription: 'Fix leaks, missing shingles, and storm damage.' },
    { name: 'Roof Replacement', shortDescription: 'Full roof replacement with warranty.' },
    { name: 'Storm Damage Repair', shortDescription: 'Fast response and insurance-claim help.', emergency: true },
    { name: 'Gutter Installation', shortDescription: 'Protect your home with new gutters.' },
    { name: 'Roof Inspection', shortDescription: 'Detailed inspections and honest reporting.' },
  ],
  faqs: [
    { question: 'Do you help with insurance claims?', answer: 'Yes — we document storm damage and work directly with your insurer.' },
    { question: 'How long does a roof replacement take?', answer: 'Most residential roofs are completed in one to three days, weather permitting.' },
  ],
  imageKeywords: ['roofer', 'shingle roof', 'roof repair', 'gutter', 'storm damage'],
  blogCategories: ['Roof Repair', 'Materials', 'Storm Damage', 'Maintenance'],
  promptHints: 'Emphasize durability, warranties, storm response, and insurance-claim assistance.',
  defaultThemeId: 'corporate',
  defaultTemplateId: 'base',
};

const electrical: IndustryPack = {
  id: 'electrical',
  name: 'Electrical',
  category: 'Electrical',
  schemaType: 'Electrician',
  terminology: {
    professional: 'electrician',
    service: 'electrical service',
    emergencyName: 'emergency electrical repair',
  },
  services: [
    { name: 'Panel Upgrades', shortDescription: 'Modern, safe electrical panel upgrades.' },
    { name: 'Wiring & Rewiring', shortDescription: 'Safe wiring for remodels and older homes.' },
    { name: 'Lighting Installation', shortDescription: 'Indoor and outdoor lighting installs.' },
    { name: 'EV Charger Installation', shortDescription: 'Home EV charging stations installed to code.' },
    { name: 'Emergency Electrical', shortDescription: '24/7 response for outages and hazards.', emergency: true },
  ],
  faqs: [
    { question: 'Are your electricians licensed?', answer: 'Yes — all work is performed by licensed, insured electricians and completed to code.' },
    { question: 'Can you install an EV charger?', answer: 'Absolutely. We size the circuit, pull permits, and install to manufacturer spec.' },
  ],
  imageKeywords: ['electrician', 'electrical panel', 'wiring', 'ev charger', 'lighting'],
  blogCategories: ['Safety', 'Panels & Wiring', 'Lighting', 'EV Charging'],
  promptHints: 'Emphasize safety, code compliance, licensing, and modern upgrades like EV chargers.',
  defaultThemeId: 'blue-collar',
  defaultTemplateId: 'base',
};

const generic: IndustryPack = {
  id: 'generic',
  name: 'Local Service',
  category: 'Local Service',
  schemaType: 'LocalBusiness',
  terminology: {
    professional: 'technician',
    service: 'service',
    emergencyName: 'emergency service',
  },
  services: [
    { name: 'Repairs', shortDescription: 'Fast, reliable repairs done right.' },
    { name: 'Installation', shortDescription: 'Professional installation you can trust.' },
    { name: 'Maintenance', shortDescription: 'Keep everything running smoothly.' },
    { name: 'Emergency Service', shortDescription: '24/7 response when you need it most.', emergency: true },
  ],
  faqs: [
    { question: 'Do you offer free quotes?', answer: 'Yes — upfront, no-obligation quotes before any work begins.' },
    { question: 'Are you licensed and insured?', answer: 'Yes, fully licensed, insured, and background-checked.' },
  ],
  imageKeywords: ['technician', 'service van', 'tools', 'home service'],
  blogCategories: ['Tips & Advice', 'Cost Guides', 'How-To', 'Maintenance'],
  promptHints: 'Emphasize trust, upfront pricing, fast local response, and guaranteed work.',
  defaultThemeId: 'minimal',
  defaultTemplateId: 'generic',
};

export const industryRegistry: Record<string, IndustryPack> = {
  plumbing,
  hvac,
  roofing,
  electrical,
  generic,
};

export function getIndustry(id: string): IndustryPack {
  return industryRegistry[id] ?? generic;
}

export function listIndustries(): IndustryPack[] {
  return Object.values(industryRegistry);
}

/** Find the industry pack matching a business category (falls back to generic). */
export function matchIndustryByCategory(category: string): IndustryPack {
  const norm = category.trim().toLowerCase();
  return (
    listIndustries().find((p) => p.category.toLowerCase() === norm) ??
    listIndustries().find((p) => norm.includes(p.id)) ??
    generic
  );
}
