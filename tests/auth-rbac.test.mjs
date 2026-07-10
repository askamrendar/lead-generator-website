import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  hasAtLeast,
  maxRole,
  rankOf,
  isRole,
} from '../lib/auth/permissions/roles.ts';
import { can, requiredRole } from '../lib/auth/permissions/rbac.ts';

test('role hierarchy ranks OWNER > ADMIN > MEMBER > VIEWER', () => {
  assert.ok(rankOf('OWNER') > rankOf('ADMIN'));
  assert.ok(rankOf('ADMIN') > rankOf('MEMBER'));
  assert.ok(rankOf('MEMBER') > rankOf('VIEWER'));
});

test('hasAtLeast is inclusive and directional', () => {
  assert.equal(hasAtLeast('ADMIN', 'MEMBER'), true);
  assert.equal(hasAtLeast('ADMIN', 'ADMIN'), true);
  assert.equal(hasAtLeast('MEMBER', 'ADMIN'), false);
});

test('maxRole returns the more privileged role', () => {
  assert.equal(maxRole('MEMBER', 'ADMIN'), 'ADMIN');
  assert.equal(maxRole('OWNER', 'VIEWER'), 'OWNER');
  assert.equal(maxRole('VIEWER', 'VIEWER'), 'VIEWER');
});

test('isRole guards unknown values', () => {
  assert.equal(isRole('OWNER'), true);
  assert.equal(isRole('SUPERUSER'), false);
  assert.equal(isRole(3), false);
});

test('can() enforces the permission matrix', () => {
  // Viewers can read but not mutate.
  assert.equal(can('VIEWER', 'project:view'), true);
  assert.equal(can('VIEWER', 'project:create'), false);
  // Members can manage projects/websites but not delete orgs.
  assert.equal(can('MEMBER', 'website:create'), true);
  assert.equal(can('MEMBER', 'org:delete'), false);
  // Only OWNER can delete an org or manage billing.
  assert.equal(can('ADMIN', 'org:delete'), false);
  assert.equal(can('OWNER', 'org:delete'), true);
  assert.equal(can('OWNER', 'org:manage_billing'), true);
});

test('requiredRole exposes the minimum for a permission', () => {
  assert.equal(requiredRole('org:delete'), 'OWNER');
  assert.equal(requiredRole('project:view'), 'VIEWER');
  assert.equal(requiredRole('website:publish'), 'ADMIN');
});
