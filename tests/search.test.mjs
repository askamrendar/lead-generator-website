import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  staticCommands,
  filterCommands,
  groupResults,
} from '../lib/search/registry.ts';

test('static commands include actions and navigation', () => {
  const cmds = staticCommands();
  assert.ok(cmds.some((c) => c.group === 'Actions'));
  assert.ok(cmds.some((c) => c.group === 'Navigate'));
  assert.ok(cmds.some((c) => c.href === '/dashboard/websites'));
});

test('filterCommands is case-insensitive over title + subtitle', () => {
  const cmds = staticCommands();
  const hits = filterCommands(cmds, 'websites');
  assert.ok(hits.length > 0);
  assert.ok(hits.every((c) => (c.title + (c.subtitle ?? '')).toLowerCase().includes('websites')));
  // empty query returns all
  assert.equal(filterCommands(cmds, '').length, cmds.length);
});

test('groupResults orders groups by GROUP_ORDER (Actions before Navigate)', () => {
  const grouped = groupResults([
    { id: 'n', title: 'Nav', href: '/x', group: 'Navigate' },
    { id: 'a', title: 'Act', href: '/y', group: 'Actions' },
    { id: 'w', title: 'Web', href: '/z', group: 'Websites' },
  ]);
  const order = grouped.map(([g]) => g);
  assert.deepEqual(order, ['Actions', 'Websites', 'Navigate']);
});
