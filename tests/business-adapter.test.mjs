import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hexToHslTriplet, wizardToBusinessConfig } from '../lib/websites/business-adapter.ts';

const sampleWizard = {
  business: { businessName: 'Apex Plumbing', category: 'Plumbing', primaryService: 'Drain Cleaning', additionalServices: ['Water Heater Repair', 'Leak Detection'] },
  location: { country: 'United States', state: 'Texas', city: 'Austin', zipCodes: ['78701', '78702'], neighborhoods: ['Downtown'] },
  brand: { logoUrl: '', primaryColor: '#2563eb', accentColor: '#f97316', fontFamily: 'Inter' },
  details: { phone: '512-555-0100', email: 'hello@apex.com', hours: '', website: '', facebook: '', instagram: '', x: '' },
  seo: { targetKeywords: ['plumber austin'], competitors: ['https://rival.com', 'not-a-url'], servicePages: 5, locationPages: 10 },
};

test('hexToHslTriplet converts hex to "H S% L%"', () => {
  const hsl = hexToHslTriplet('#2563eb', 'x');
  assert.match(hsl, /^\d+ \d+% \d+%$/);
  assert.equal(hexToHslTriplet('bad', 'fallback'), 'fallback');
});

test('wizardToBusinessConfig maps identity + contact', () => {
  const cfg = wizardToBusinessConfig(sampleWizard);
  assert.equal(cfg.name, 'Apex Plumbing');
  assert.equal(cfg.category, 'Plumbing');
  assert.equal(cfg.phone, '512-555-0100');
  assert.equal(cfg.address.city, 'Austin');
  assert.equal(cfg.address.stateAbbr, 'TX'); // USPS abbr via the geo pack
  assert.equal(cfg.address.zip, '78701');
});

test('wizardToBusinessConfig builds services from primary + additional', () => {
  const cfg = wizardToBusinessConfig(sampleWizard);
  const names = cfg.services.map((s) => s.name);
  assert.deepEqual(names, ['Drain Cleaning', 'Water Heater Repair', 'Leak Detection']);
  assert.equal(cfg.primaryService, 'Drain Cleaning');
});

test('wizardToBusinessConfig filters non-URL competitors and keeps one state/city', () => {
  const cfg = wizardToBusinessConfig(sampleWizard);
  assert.deepEqual(cfg.competitorUrls, ['https://rival.com']);
  assert.equal(cfg.states.length, 1);
  assert.equal(cfg.states[0].cities[0].name, 'Austin');
  assert.deepEqual(cfg.states[0].cities[0].zips, ['78701', '78702']);
});

test('wizardToBusinessConfig output is a valid generator config', async () => {
  // Round-trip through the generator schema to prove the adapter satisfies its contract.
  const { businessConfigSchema } = await import('../lib/generator/schema.ts');
  const cfg = wizardToBusinessConfig(sampleWizard);
  const parsed = businessConfigSchema.safeParse(cfg);
  assert.equal(parsed.success, true, parsed.success ? '' : JSON.stringify(parsed.error.issues));
});

test('adapter resolves ANY US state (name or abbr) to the correct USPS code', () => {
  const cases = [
    ['New york', 'NY', 'New York'],
    ['ny', 'NY', 'New York'],
    ['california', 'CA', 'California'],
    ['FL', 'FL', 'Florida'],
    ['washington', 'WA', 'Washington'],
    ['North carolina', 'NC', 'North Carolina'],
  ];
  for (const [typed, abbr, name] of cases) {
    const cfg = wizardToBusinessConfig({
      ...sampleWizard,
      location: { ...sampleWizard.location, state: typed, city: 'Anytown' },
    });
    assert.equal(cfg.address.stateAbbr, abbr, `typed "${typed}"`);
    assert.equal(cfg.states[0].name, name, `typed "${typed}"`);
    assert.equal(cfg.states[0].abbr, abbr, `typed "${typed}"`);
  }
});

test('adapter supports additional cities (deduped, primary first)', () => {
  const cfg = wizardToBusinessConfig({
    ...sampleWizard,
    location: {
      ...sampleWizard.location,
      city: 'Austin',
      additionalCities: ['Round Rock', 'Cedar Park', 'austin', 'Round Rock'],
    },
  });
  assert.deepEqual(
    cfg.states[0].cities.map((c) => c.name),
    ['Austin', 'Round Rock', 'Cedar Park'],
  );
});

test('adapter cleans malformed ZIP input (the Empire UAT case)', () => {
  const cfg = wizardToBusinessConfig({
    ...sampleWizard,
    location: { ...sampleWizard.location, zipCodes: ['87496 76032', 'bad'] },
  });
  assert.deepEqual(cfg.states[0].cities[0].zips, ['87496', '76032']);
  assert.equal(cfg.address.zip, '87496');
});
