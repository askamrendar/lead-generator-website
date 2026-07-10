import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAccessContext,
  assertAuthenticated,
  assertFound,
  resolveEffectiveRole,
  authorize,
  permissionsForRole,
  organizationScope,
  workspaceScope,
  projectScope,
  websiteScope,
  tenantScope,
} from '../lib/auth/access/engine.ts';

// ── Fixtures: tenant chains at each depth ────────────────────────────────────────
const orgChain = { organizationId: 'org1' };
const workspaceChain = { organizationId: 'org1', workspaceId: 'ws1' };
const projectChain = { organizationId: 'org1', workspaceId: 'ws1', projectId: 'pr1' };
const websiteChain = {
  organizationId: 'org1',
  workspaceId: 'ws1',
  projectId: 'pr1',
  websiteId: 'wb1',
};

/** Return the AccessError code thrown by `fn`, or null if it did not throw. */
function codeOf(fn) {
  try {
    fn();
    return null;
  } catch (err) {
    return err.code ?? err.message;
  }
}

// ── Happy path + scoped context shape ────────────────────────────────────────────

test('builds a scoped context for an authorized member', () => {
  const ctx = buildAccessContext({
    userId: 'u1',
    chain: websiteChain,
    role: 'ADMIN',
    permission: 'website:update',
  });
  assert.equal(ctx.userId, 'u1');
  assert.equal(ctx.organization.id, 'org1');
  assert.equal(ctx.workspace.id, 'ws1');
  assert.equal(ctx.project.id, 'pr1');
  assert.equal(ctx.website.id, 'wb1');
  assert.equal(ctx.role, 'ADMIN');
  assert.equal(ctx.can('website:update'), true);
  assert.equal(ctx.can('org:delete'), false); // ADMIN cannot delete the org
  assert.ok(ctx.permissions.includes('website:update'));
});

test('context omits levels absent from the chain', () => {
  const ctx = buildAccessContext({
    userId: 'u1',
    chain: orgChain,
    role: 'OWNER',
    permission: 'org:view',
  });
  assert.equal(ctx.organization.id, 'org1');
  assert.equal(ctx.workspace, undefined);
  assert.equal(ctx.project, undefined);
  assert.equal(ctx.website, undefined);
});

// ── Tenant isolation (org / workspace / project / website) ───────────────────────

test('non-membership is tenant-hidden as NOT_FOUND at every depth', () => {
  for (const chain of [orgChain, workspaceChain, projectChain, websiteChain]) {
    const code = codeOf(() =>
      buildAccessContext({ userId: 'u1', chain, role: null, permission: 'org:view' }),
    );
    assert.equal(code, 'NOT_FOUND'); // never FORBIDDEN → existence not leaked
  }
});

// ── Fail-closed ordering ─────────────────────────────────────────────────────────

test('unauthenticated is rejected before membership/permission', () => {
  const code = codeOf(() =>
    buildAccessContext({
      userId: null,
      chain: websiteChain,
      role: null,
      permission: 'website:view',
    }),
  );
  assert.equal(code, 'UNAUTHENTICATED');
});

test('a member with an insufficient role is FORBIDDEN', () => {
  const code = codeOf(() =>
    buildAccessContext({
      userId: 'u1',
      chain: websiteChain,
      role: 'VIEWER',
      permission: 'website:create',
    }),
  );
  assert.equal(code, 'FORBIDDEN');
});

// ── Primitive guards ─────────────────────────────────────────────────────────────

test('assertAuthenticated throws UNAUTHENTICATED on falsy user', () => {
  assert.equal(codeOf(() => assertAuthenticated(null)), 'UNAUTHENTICATED');
  assert.equal(codeOf(() => assertAuthenticated('')), 'UNAUTHENTICATED');
  assert.equal(codeOf(() => assertAuthenticated('u1')), null);
});

test('assertFound throws the given code for missing resources', () => {
  assert.equal(codeOf(() => assertFound(null, 'INVALID_WEBSITE')), 'INVALID_WEBSITE');
  assert.equal(codeOf(() => assertFound(undefined, 'INVALID_PROJECT')), 'INVALID_PROJECT');
  assert.equal(assertFound('ok', 'INVALID_WEBSITE'), 'ok');
});

test('resolveEffectiveRole hides non-members as NOT_FOUND', () => {
  assert.equal(codeOf(() => resolveEffectiveRole(null)), 'NOT_FOUND');
  assert.equal(resolveEffectiveRole('MEMBER'), 'MEMBER');
});

test('authorize enforces the RBAC matrix', () => {
  assert.equal(codeOf(() => authorize('VIEWER', 'org:delete')), 'FORBIDDEN');
  assert.equal(codeOf(() => authorize('OWNER', 'org:delete')), null);
  assert.equal(codeOf(() => authorize('MEMBER', 'website:create')), null);
});

// ── Permission inheritance ───────────────────────────────────────────────────────

test('higher roles inherit every lower-role permission', () => {
  const owner = new Set(permissionsForRole('OWNER'));
  const admin = new Set(permissionsForRole('ADMIN'));
  const member = new Set(permissionsForRole('MEMBER'));
  const viewer = new Set(permissionsForRole('VIEWER'));

  for (const p of viewer) assert.ok(member.has(p), `MEMBER missing ${p}`);
  for (const p of member) assert.ok(admin.has(p), `ADMIN missing ${p}`);
  for (const p of admin) assert.ok(owner.has(p), `OWNER missing ${p}`);

  assert.ok(owner.size >= admin.size);
  assert.ok(admin.size >= member.size);
  assert.ok(member.size >= viewer.size);
  // A viewer only ever holds read permissions.
  for (const p of viewer) assert.ok(p.endsWith(':view'), `VIEWER has non-read ${p}`);
});

// ── Scoped query generation ──────────────────────────────────────────────────────

test('scope helpers derive tenant filters from context', () => {
  const ctx = buildAccessContext({
    userId: 'u1',
    chain: websiteChain,
    role: 'ADMIN',
    permission: 'website:view',
  });
  assert.deepEqual(organizationScope(ctx), { organizationId: 'org1' });
  assert.deepEqual(workspaceScope(ctx), { workspaceId: 'ws1' });
  assert.deepEqual(projectScope(ctx), { projectId: 'pr1' });
  assert.deepEqual(websiteScope(ctx), { websiteId: 'wb1' });
  // tightest-available
  assert.deepEqual(tenantScope(ctx), { websiteId: 'wb1' });
});

test('tenantScope falls back to the deepest available level', () => {
  const ctx = buildAccessContext({
    userId: 'u1',
    chain: orgChain,
    role: 'OWNER',
    permission: 'org:view',
  });
  assert.deepEqual(tenantScope(ctx), { organizationId: 'org1' });
});

test('scope helpers throw on misuse (missing level)', () => {
  const ctx = buildAccessContext({
    userId: 'u1',
    chain: orgChain,
    role: 'OWNER',
    permission: 'org:view',
  });
  assert.throws(() => workspaceScope(ctx));
  assert.throws(() => projectScope(ctx));
  assert.throws(() => websiteScope(ctx));
});
