import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Liveness probe (Task 8). Returns 200 whenever the process can serve HTTP —
 * NO dependency checks (that is readiness). Used by orchestrators to decide
 * whether to restart the container.
 */
export function GET() {
  return NextResponse.json({ status: 'ok' });
}
