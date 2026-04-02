import {
  calculateSummary,
  getSessionEndTime,
  type SensorDataPoint,
  type SessionRecord,
} from '@/lib/iot-data';

const THINGSPEAK_URL =
  'https://api.thingspeak.com/channels/3194508/feeds.json?results=8000';

interface ThingSpeakFeed {
  created_at?: string;
  entry_id?: number;
  field1?: string | null;
  field2?: string | null;
  field3?: string | null;
  field4?: string | null;
  field5?: string | null;
  field6?: string | null;
  field7?: string | null;
}

interface ThingSpeakResponse {
  feeds?: ThingSpeakFeed[];
}

const toSafeFloat = (value?: string | null): number => {
  const parsed = Number.parseFloat(value ?? '');
  return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : 0;
};

const mapThingSpeakFeed = (feed: ThingSpeakFeed): SensorDataPoint | null => {
  if (!feed.created_at) {
    return null;
  }

  return {
    timestamp: new Date(feed.created_at).toISOString(),
    turbidity: toSafeFloat(feed.field1),
    humidity: toSafeFloat(feed.field2),
    temp: toSafeFloat(feed.field3),
    alcohol: toSafeFloat(feed.field4),
    voc: toSafeFloat(feed.field5),
    ammonia: toSafeFloat(feed.field6),
    h2s: toSafeFloat(feed.field7),
  };
};

export async function fetchThingSpeakData(): Promise<SensorDataPoint[]> {
  const response = await fetch(THINGSPEAK_URL, {
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`ThingSpeak request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as ThingSpeakResponse;
  const feeds = Array.isArray(payload.feeds) ? payload.feeds : [];

  return feeds
    .map(mapThingSpeakFeed)
    .filter((feed): feed is SensorDataPoint => Boolean(feed))
    .sort(
      (left, right) =>
        new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime()
    );
}

export function filterDataBySession(
  data: SensorDataPoint[],
  session: SessionRecord
): SensorDataPoint[] {
  const sessionStart = new Date(session.start_time).getTime();
  const sessionEnd = new Date(getSessionEndTime(session)).getTime();

  return data.filter((point) => {
    const timestamp = new Date(point.timestamp).getTime();
    return timestamp >= sessionStart && timestamp <= sessionEnd;
  });
}

export async function getSessionDataFromThingSpeak(session: SessionRecord) {
  const allData = await fetchThingSpeakData();
  const filteredData = filterDataBySession(allData, session);

  return {
    data: filteredData,
    summary: calculateSummary(filteredData),
  };
}
