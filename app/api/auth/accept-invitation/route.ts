import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Team invitations were removed — this is a single-user-per-account SaaS. The endpoint
 * is retained only to answer old links with a clear 410 Gone; the route should be
 * deleted in cleanup. No Team models are referenced.
 */
export async function POST() {
  return NextResponse.json(
    { error: 'Team invitations are no longer supported.' },
    { status: 410 },
  );
}
