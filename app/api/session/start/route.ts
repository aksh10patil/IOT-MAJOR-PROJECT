import { NextResponse } from 'next/server';

import { createSession, findActiveSession } from '@/lib/session-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { label?: string };
    const label = body.label?.trim();

    if (!label) {
      return NextResponse.json(
        { error: 'A session label is required.' },
        { status: 400 }
      );
    }

    const activeSession = await findActiveSession();

    if (activeSession) {
      return NextResponse.json(
        {
          error:
            'An active session is already running. End the current session before starting a new one.',
          activeSession,
        },
        { status: 409 }
      );
    }

    const session = await createSession(label);

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to start session.';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
