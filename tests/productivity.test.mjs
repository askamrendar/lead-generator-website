import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pushRevision, readRevisions, findRevision, MAX_REVISIONS } from '../lib/productivity/revisions.ts';
import { listBlueprints, getBlueprint, blueprintCategories } from '../lib/productivity/templates.ts';

test('pushRevision prepends newest-first', () => {
  const r1 = { id: 'a', at: '2026-01-01T00:00:00Z', label: 'one' };
  const r2 = { id: 'b', at: '2026-01-02T00:00:00Z', label: 'two' };
  const list = pushRevision(pushRevision([], r1), r2);
  assert.equal(list[0].id, 'b');
  assert.equal(list[1].id, 'a');
});

test('pushRevision is bounded to MAX_REVISIONS', () => {
  let list = [];
  for (let i = 0; i < MAX_REVISIONS + 10; i++) {
    list = pushRevision(list, { id: `r${i}`, at: '2026-01-01T00:00:00Z', label: `r${i}` });
  }
  assert.equal(list.length, MAX_REVISIONS);
  assert.equal(list[0].id, `r${MAX_REVISIONS + 9}`); // newest kept
});

test('readRevisions defends against bad JSON', () => {
  assert.deepEqual(readRevisions(null), []);
  assert.deepEqual(readRevisions('nope'), []);
  assert.deepEqual(readRevisions([{ nope: 1 }]), []); // missing id
  assert.equal(readRevisions([{ id: 'x', at: 't', label: 'l' }]).length, 1);
});

test('findRevision locates by id', () => {
  const raw = [{ id: 'x', at: 't', label: 'l' }, { id: 'y', at: 't', label: 'l' }];
  assert.equal(findRevision(raw, 'y')?.id, 'y');
  assert.equal(findRevision(raw, 'z'), null);
});

test('blueprint catalog is non-empty and addressable', () => {
  assert.ok(listBlueprints().length >= 6);
  assert.equal(getBlueprint('plumbing-local')?.industryId, 'plumbing');
  assert.equal(getBlueprint('nope'), null);
  assert.ok(blueprintCategories().includes('Home Services'));
});
