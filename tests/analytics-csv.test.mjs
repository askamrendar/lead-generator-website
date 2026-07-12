import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toCsv } from '../lib/analytics/csv.ts';

test('builds CSV with header from keys', () => {
  const csv = toCsv([{ metric: 'Websites', value: 3 }, { metric: 'Deployments', value: 12 }]);
  assert.equal(csv, 'metric,value\nWebsites,3\nDeployments,12');
});

test('respects explicit column order', () => {
  const csv = toCsv([{ a: 1, b: 2 }], ['b', 'a']);
  assert.equal(csv, 'b,a\n2,1');
});

test('escapes commas, quotes, newlines', () => {
  const csv = toCsv([{ name: 'Doe, Jane', note: 'say "hi"\nok' }]);
  assert.ok(csv.includes('"Doe, Jane"'));
  assert.ok(csv.includes('"say ""hi""\nok"'));
});

test('handles null/undefined + empty rows', () => {
  assert.equal(toCsv([{ x: null, y: undefined }]), 'x,y\n,');
  assert.equal(toCsv([]), '');
});
