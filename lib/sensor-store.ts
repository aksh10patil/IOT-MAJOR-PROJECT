import {
  calculateSummary,
  getSessionEndTime,
  type SensorDataPoint,
  type SessionRecord,
} from '@/lib/iot-data';
import { getSql } from '@/lib/neon';

type DbSensorRow = {
  id: string;
  timestamp: string | Date;
  turbidity: number;
  humidity: number;
  temp: number;
  alcohol: number;
  voc: number;
  ammonia: number;
  h2s: number;
};

const normalizeSensorRow = (row: DbSensorRow): SensorDataPoint => ({
  id: row.id,
  timestamp: new Date(row.timestamp).toISOString(),
  turbidity: Number(row.turbidity),
  humidity: Number(row.humidity),
  temp: Number(row.temp),
  alcohol: Number(row.alcohol),
  voc: Number(row.voc),
  ammonia: Number(row.ammonia),
  h2s: Number(row.h2s),
});

export async function upsertSensorData(data: SensorDataPoint[]) {
  if (data.length === 0) {
    return;
  }

  const sql = getSql();

  for (const point of data) {
    await sql`
      INSERT INTO sensor_data (
        id,
        timestamp,
        turbidity,
        humidity,
        temp,
        alcohol,
        voc,
        ammonia,
        h2s
      )
      VALUES (
        ${crypto.randomUUID()}::uuid,
        ${point.timestamp}::timestamptz,
        ${point.turbidity},
        ${point.humidity},
        ${point.temp},
        ${point.alcohol},
        ${point.voc},
        ${point.ammonia},
        ${point.h2s}
      )
      ON CONFLICT (timestamp) DO UPDATE SET
        turbidity = EXCLUDED.turbidity,
        humidity = EXCLUDED.humidity,
        temp = EXCLUDED.temp,
        alcohol = EXCLUDED.alcohol,
        voc = EXCLUDED.voc,
        ammonia = EXCLUDED.ammonia,
        h2s = EXCLUDED.h2s
    `;
  }
}

export async function listSensorDataForSession(session: SessionRecord) {
  const sql = getSql();
  const rows = (await sql`
    SELECT
      id::text AS id,
      timestamp,
      turbidity,
      humidity,
      temp,
      alcohol,
      voc,
      ammonia,
      h2s
    FROM sensor_data
    WHERE timestamp >= ${session.start_time}::timestamptz
      AND timestamp <= ${getSessionEndTime(session)}::timestamptz
    ORDER BY timestamp ASC
  `) as DbSensorRow[];

  const data = rows.map(normalizeSensorRow);

  return {
    data,
    summary: calculateSummary(data),
  };
}
