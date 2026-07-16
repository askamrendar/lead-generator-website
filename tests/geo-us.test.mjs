import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  US_STATES,
  findUsState,
  usStateAbbr,
  isValidUsZip,
  cleanUsZips,
} from '../lib/geo/us-states.ts';
import { US_CITIES, citiesForState } from '../lib/geo/us-cities.ts';

test('all 50 states + DC present with unique 2-letter abbreviations', () => {
  assert.equal(US_STATES.length, 51);
  const abbrs = new Set(US_STATES.map((s) => s.abbr));
  assert.equal(abbrs.size, 51);
  for (const s of US_STATES) {
    assert.match(s.abbr, /^[A-Z]{2}$/);
    assert.match(s.slug, /^[a-z-]+$/);
  }
});

test('findUsState resolves names and abbreviations, any casing', () => {
  assert.equal(findUsState('New York')?.abbr, 'NY');
  assert.equal(findUsState('new york')?.abbr, 'NY');
  assert.equal(findUsState('  NEW   YORK ')?.abbr, 'NY');
  assert.equal(findUsState('ny')?.name, 'New York');
  assert.equal(findUsState('TX')?.name, 'Texas');
  assert.equal(findUsState('California')?.abbr, 'CA');
  assert.equal(findUsState('Ontario'), null);
  assert.equal(findUsState(''), null);
});

test('usStateAbbr fixes the slice(0,2) bug', () => {
  // The old code produced "NE" (Nebraska!) for New York and "TE" for Texas.
  assert.equal(usStateAbbr('New york'), 'NY');
  assert.equal(usStateAbbr('Texas'), 'TX');
  assert.equal(usStateAbbr('washington'), 'WA');
  // Non-US falls back to first two letters (schema needs 2 chars).
  assert.equal(usStateAbbr('Ontario'), 'ON');
});

test('isValidUsZip accepts 5-digit and ZIP+4 only', () => {
  assert.ok(isValidUsZip('78701'));
  assert.ok(isValidUsZip('78701-1234'));
  assert.ok(!isValidUsZip('8749'));
  assert.ok(!isValidUsZip('87496 76032'));
  assert.ok(!isValidUsZip('abcde'));
});

test('cleanUsZips splits space-joined pairs, drops invalid, dedupes', () => {
  // The exact malformed input from the Empire Plumbing UAT run.
  assert.deepEqual(cleanUsZips(['87496 76032']), ['87496', '76032']);
  assert.deepEqual(cleanUsZips(['78701', '78701', 'nope', '787']), ['78701']);
  assert.deepEqual(cleanUsZips([]), []);
});

test('every state has city suggestions; lookup works by name or abbr', () => {
  for (const s of US_STATES) {
    assert.ok((US_CITIES[s.abbr] ?? []).length > 0, `no cities for ${s.abbr}`);
  }
  assert.ok(citiesForState('NY').includes('New York'));
  assert.ok(citiesForState('New York').includes('Buffalo'));
  assert.ok(citiesForState('texas').includes('Houston'));
  assert.deepEqual(citiesForState('Ontario'), []);
});
