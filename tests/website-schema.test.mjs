import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  businessStepSchema,
  locationStepSchema,
  brandStepSchema,
  seoStepSchema,
  websiteWizardSchema,
} from '../lib/websites/schema.ts';

test('business step: valid input, CSV services become a clean array', () => {
  const r = businessStepSchema.safeParse({
    businessName: 'Apex Plumbing',
    category: 'Plumbing',
    primaryService: 'Drain Cleaning',
    additionalServices: 'Water Heaters, , Leak Repair\nSewer',
  });
  assert.equal(r.success, true);
  assert.deepEqual(r.data.additionalServices, ['Water Heaters', 'Leak Repair', 'Sewer']);
});

test('business step: rejects a too-short name', () => {
  assert.equal(
    businessStepSchema.safeParse({ businessName: 'A', category: 'Plumbing', primaryService: 'X' })
      .success,
    false,
  );
});

test('location step: requires state + city', () => {
  assert.equal(locationStepSchema.safeParse({ state: '', city: 'Austin' }).success, false);
  const ok = locationStepSchema.safeParse({ state: 'Texas', city: 'Austin', zipCodes: '78701, 78702' });
  assert.equal(ok.success, true);
  assert.deepEqual(ok.data.zipCodes, ['78701', '78702']);
});

test('brand step: validates hex colors and applies defaults', () => {
  const ok = brandStepSchema.safeParse({});
  assert.equal(ok.success, true);
  assert.equal(ok.data.primaryColor, '#2563eb');
  assert.equal(brandStepSchema.safeParse({ primaryColor: 'blue' }).success, false);
});

test('seo step: coerces page counts and clamps types', () => {
  const r = seoStepSchema.safeParse({ servicePages: '8', locationPages: '20' });
  assert.equal(r.success, true);
  assert.equal(r.data.servicePages, 8);
  assert.equal(r.data.locationPages, 20);
  assert.equal(seoStepSchema.safeParse({ servicePages: -1 }).success, false);
});

test('full wizard schema composes all steps', () => {
  const r = websiteWizardSchema.safeParse({
    business: { businessName: 'Apex Plumbing', category: 'Plumbing', primaryService: 'Drains' },
    location: { state: 'Texas', city: 'Austin' },
    brand: {},
    details: { phone: '512-555-1234', email: 'hi@apex.com' },
    seo: {},
  });
  assert.equal(r.success, true);
  assert.equal(r.data.brand.fontFamily, 'Inter');
  assert.equal(r.data.seo.servicePages, 5);
});
