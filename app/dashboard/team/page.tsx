import { redirect } from 'next/navigation';

/**
 * Team collaboration was removed — this is a single-user-per-account SaaS. This route
 * is retained only as a redirect so any old bookmark lands somewhere sensible; the
 * directory should be deleted in cleanup.
 */
export default function TeamPage() {
  redirect('/dashboard');
}
