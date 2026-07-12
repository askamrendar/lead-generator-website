// Phase 9 — Website Templates / Blueprint Library. Pure catalog of starter blueprints.
// A blueprint seeds a new website's businessConfig defaults; it reuses the existing
// wizard/business shape (no new format) and the Builder composes pages from it.

export interface Blueprint {
  id: string;
  name: string;
  description: string;
  industryId: string;
  category: string;
  /** Suggested services to pre-fill (business.services). */
  services: string[];
}

export const BLUEPRINTS: Blueprint[] = [
  {
    id: 'plumbing-local',
    name: 'Local Plumbing Co.',
    description: 'Emergency + scheduled plumbing services with service-area pages.',
    industryId: 'plumbing',
    category: 'Home Services',
    services: ['Emergency Plumbing', 'Drain Cleaning', 'Water Heater Repair', 'Leak Detection'],
  },
  {
    id: 'hvac-local',
    name: 'HVAC & Air',
    description: 'Heating, cooling, and maintenance plans for a local HVAC business.',
    industryId: 'hvac',
    category: 'Home Services',
    services: ['AC Repair', 'Heating Installation', 'Duct Cleaning', 'Maintenance Plans'],
  },
  {
    id: 'electrician-local',
    name: 'Licensed Electrician',
    description: 'Residential + commercial electrical services with trust signals.',
    industryId: 'electrical',
    category: 'Home Services',
    services: ['Panel Upgrades', 'Wiring', 'Lighting', 'EV Charger Install'],
  },
  {
    id: 'roofing-local',
    name: 'Roofing Experts',
    description: 'Roof repair, replacement, and inspection with financing callouts.',
    industryId: 'roofing',
    category: 'Home Services',
    services: ['Roof Repair', 'Roof Replacement', 'Inspections', 'Storm Damage'],
  },
  {
    id: 'landscaping-local',
    name: 'Landscaping & Lawn',
    description: 'Design, maintenance, and seasonal services for a landscaping company.',
    industryId: 'landscaping',
    category: 'Outdoor',
    services: ['Lawn Care', 'Landscape Design', 'Irrigation', 'Snow Removal'],
  },
  {
    id: 'cleaning-local',
    name: 'Cleaning Service',
    description: 'Residential and commercial cleaning with recurring plans.',
    industryId: 'cleaning',
    category: 'Home Services',
    services: ['House Cleaning', 'Deep Cleaning', 'Move-Out Cleaning', 'Office Cleaning'],
  },
];

export function listBlueprints(): Blueprint[] {
  return BLUEPRINTS;
}

export function getBlueprint(id: string): Blueprint | null {
  return BLUEPRINTS.find((b) => b.id === id) ?? null;
}

export function blueprintCategories(): string[] {
  return [...new Set(BLUEPRINTS.map((b) => b.category))];
}
