import { NextResponse } from 'next/server';

import { listSessions } from '@/lib/session-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sessions = await listSessions();
    return NextResponse.json({ sessions });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to load sessions.';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
