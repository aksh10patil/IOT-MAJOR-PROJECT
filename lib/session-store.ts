import { getSql } from '@/lib/neon';
import {
  normalizeSessionRecord,
  type SessionRecord,
} from '@/lib/iot-data';

type DbSessionRow = {
  id: string;
  label: string;
  start_time: string | Date;
  end_time: string | Date | null;
};

export async function listSessions(): Promise<SessionRecord[]> {
  const sql = getSql();
  const rows = (await sql`
    SELECT id::text AS id, label, start_time, end_time
    FROM sessions
    ORDER BY start_time DESC
  `) as DbSessionRow[];

  return rows.map(normalizeSessionRecord);
}

export async function findSessionById(
  sessionId: string
): Promise<SessionRecord | null> {
  const sql = getSql();
  const rows = (await sql`
    SELECT id::text AS id, label, start_time, end_time
    FROM sessions
    WHERE id = ${sessionId}::uuid
    LIMIT 1
  `) as DbSessionRow[];

  const session = rows[0];
  return session ? normalizeSessionRecord(session) : null;
}

export async function findActiveSession(): Promise<SessionRecord | null> {
  const sql = getSql();
  const rows = (await sql`
    SELECT id::text AS id, label, start_time, end_time
    FROM sessions
    WHERE end_time IS NULL
    ORDER BY start_time DESC
    LIMIT 1
  `) as DbSessionRow[];

  const session = rows[0];
  return session ? normalizeSessionRecord(session) : null;
}

export async function createSession(label: string): Promise<SessionRecord> {
  const sql = getSql();
  const rows = (await sql`
    INSERT INTO sessions (id, label, start_time)
    VALUES (${crypto.randomUUID()}::uuid, ${label.trim()}, NOW())
    RETURNING id::text AS id, label, start_time, end_time
  `) as DbSessionRow[];

  return normalizeSessionRecord(rows[0]);
}

export async function endSession(sessionId?: string): Promise<SessionRecord | null> {
  const sql = getSql();

  if (sessionId) {
    const rows = (await sql`
      UPDATE sessions
      SET end_time = NOW()
      WHERE id = ${sessionId}::uuid
        AND end_time IS NULL
      RETURNING id::text AS id, label, start_time, end_time
    `) as DbSessionRow[];

    const session = rows[0];
    return session ? normalizeSessionRecord(session) : null;
  }

  const rows = (await sql`
    WITH active_session AS (
      SELECT id
      FROM sessions
      WHERE end_time IS NULL
      ORDER BY start_time DESC
      LIMIT 1
    )
    UPDATE sessions
    SET end_time = NOW()
    WHERE id IN (SELECT id FROM active_session)
    RETURNING id::text AS id, label, start_time, end_time
  `) as DbSessionRow[];

  const session = rows[0];
  return session ? normalizeSessionRecord(session) : null;
}
