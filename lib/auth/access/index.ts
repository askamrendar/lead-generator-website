/**
 * Tenant authorization layer — public surface.
 *
 * The ONE supported way to access tenant resources. Route handlers and server
 * actions import from here:
 *
 *   import { requireWebsiteAccess, tenantScope, accessErrorResponse } from '@/lib/auth/access';
 *
 * - `require*Access(id, permission)` → authenticated, authorized {@link AccessContext}
 * - `*Scope(ctx)` → tenant `where` fragments for child queries
 * - `accessErrorResponse(err)` → HTTP mapping for thrown {@link AccessError}s
 *
 * Never re-implement authentication, membership, permission, or tenant-filter logic
 * elsewhere — extend this layer instead (see resolver.ts `defineResourceAccess`).
 */

export {
  requireOrganizationAccess,
  requireWorkspaceAccess,
  requireProjectAccess,
  requireWebsiteAccess,
  defineResourceAccess,
} from '@/lib/auth/access/resolver';

export {
  organizationScope,
  workspaceScope,
  projectScope,
  websiteScope,
  tenantScope,
  permissionsForRole,
} from '@/lib/auth/access/engine';

export { accessErrorResponse } from '@/lib/auth/access/http';

export {
  AccessError,
  isAccessError,
  statusForCode,
  publicMessageForCode,
  ACCESS_ERROR_CODES,
  type AccessErrorCode,
} from '@/lib/auth/access/errors';

export type { AccessContext, ResourceChain } from '@/lib/auth/access/context';
