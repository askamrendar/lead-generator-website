import { redirect } from 'next/navigation';

/**
 * Team invitations were removed — this is a single-user-per-account SaaS. This route
 * is retained only as a redirect so any old invitation link lands somewhere sensible;
 * the directory should be deleted in cleanup.
 */
export default async function InvitationPage() {
  redirect('/login');
}
