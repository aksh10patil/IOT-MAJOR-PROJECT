import { NextResponse } from 'next/server';

import { listSensorDataForSession, upsertSensorData } from '@/lib/sensor-store';
import { findSessionById } from '@/lib/session-store';
import { getSessionDataFromThingSpeak } from '@/lib/thingspeak';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId query parameter is required.' },
        { status: 400 }
      );
    }

    const session = await findSessionById(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found.' },
        { status: 404 }
      );
    }

    const { data: liveData } = await getSessionDataFromThingSpeak(session);

    await upsertSensorData(liveData);

    const { data, summary } = await listSensorDataForSession(session);

    return NextResponse.json({
      session,
      data,
      summary,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to load session data.';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
