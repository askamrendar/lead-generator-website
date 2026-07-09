import { test } from 'node:test';
import assert from 'node:assert/strict';
import { leadSchema } from '../lib/forms/lead.ts';

test('accepts a valid lead', () => {
  const r = leadSchema.safeParse({
    name: 'Jane Doe',
    phone: '512-555-0142',
    email: 'jane@example.com',
    service: 'Drain Cleaning',
    message: 'Kitchen sink is clogged.',
  });
  assert.equal(r.success, true);
});

test('honeypot: a filled company field still PASSES validation (dropped by the route, not rejected)', () => {
  // Regression guard: company used to be `.max(0)`, which made a bot 422 and
  // leaked the trap. It must now parse so the route can silently drop it.
  const r = leadSchema.safeParse({
    name: 'Bot',
    phone: '5125550142',
    email: 'bot@example.com',
    company: 'Acme Spam LLC',
  });
  assert.equal(r.success, true);
  assert.equal(r.data.company, 'Acme Spam LLC');
});

test('rejects a missing name', () => {
  const r = leadSchema.safeParse({ phone: '5125550142', email: 'x@y.com' });
  assert.equal(r.success, false);
});

test('rejects an invalid email', () => {
  const r = leadSchema.safeParse({
    name: 'Jane',
    phone: '5125550142',
    email: 'not-an-email',
  });
  assert.equal(r.success, false);
});

test('rejects a phone with no digits', () => {
  const r = leadSchema.safeParse({
    name: 'Jane',
    phone: 'call-me',
    email: 'x@y.com',
  });
  assert.equal(r.success, false);
});
