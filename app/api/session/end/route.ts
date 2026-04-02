import { NextResponse } from 'next/server';

import { endSession } from '@/lib/session-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      sessionId?: string;
    };

    const session = await endSession(body.sessionId);

    if (!session) {
      return NextResponse.json(
        { error: 'No active session was found to end.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ session });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to end session.';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
