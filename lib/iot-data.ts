export const SENSOR_KEYS = [
  'turbidity',
  'humidity',
  'temp',
  'alcohol',
  'voc',
  'ammonia',
  'h2s',
] as const;

export const HISTORY_LENGTH = 12;

export type SensorKey = (typeof SENSOR_KEYS)[number];
export type Quality = 'safe' | 'warning' | 'unsafe' | 'idle';
export type SensorHistory = Record<SensorKey, number[]>;
export type SensorReadings = Record<SensorKey, number>;
export type SensorStatus = 'good' | 'warning' | 'danger';

export interface SessionRecord {
  id: string;
  label: string;
  start_time: string;
  end_time: string | null;
}

export interface SensorDataPoint extends SensorReadings {
  id?: string;
  timestamp: string;
}

export interface SessionSummary {
  totalSamples: number;
  avgTemp: number;
  avgHumidity: number;
  avgAlcohol: number;
  avgVoc: number;
  maxAmmonia: number;
  maxH2s: number;
  maxTurbidity: number;
}

export const EMPTY_READINGS: SensorReadings = {
  turbidity: 0,
  humidity: 0,
  temp: 0,
  alcohol: 0,
  voc: 0,
  ammonia: 0,
  h2s: 0,
};

export const EMPTY_SUMMARY: SessionSummary = {
  totalSamples: 0,
  avgTemp: 0,
  avgHumidity: 0,
  avgAlcohol: 0,
  avgVoc: 0,
  maxAmmonia: 0,
  maxH2s: 0,
  maxTurbidity: 0,
};

export const SENSOR_META: Record<
  SensorKey,
  {
    label: string;
    shortLabel: string;
    color: string;
    unit: string;
  }
> = {
  turbidity: {
    label: 'Turbidity',
    shortLabel: 'Turbidity',
    color: '#84cc16',
    unit: 'NTU',
  },
  humidity: {
    label: 'Humidity',
    shortLabel: 'Humidity',
    color: '#60a5fa',
    unit: '%',
  },
  temp: {
    label: 'Temperature',
    shortLabel: 'Temp',
    color: '#fbbf24',
    unit: 'deg C',
  },
  alcohol: {
    label: 'Alcohol',
    shortLabel: 'Alcohol',
    color: '#2dd4bf',
    unit: 'ppm',
  },
  voc: {
    label: 'Total VOCs',
    shortLabel: 'VOC',
    color: '#c084fc',
    unit: 'ppb',
  },
  ammonia: {
    label: 'Ammonia',
    shortLabel: 'Ammonia',
    color: '#fb7185',
    unit: 'ppm',
  },
  h2s: {
    label: 'H2S Gas',
    shortLabel: 'H2S',
    color: '#f43f5e',
    unit: 'ppm',
  },
};

const SENSOR_THRESHOLDS: Record<SensorKey, { warning: number; danger: number }> =
  {
    turbidity: { warning: 50, danger: 100 },
    humidity: { warning: 85, danger: 95 },
    temp: { warning: 30, danger: 40 },
    alcohol: { warning: 50, danger: 100 },
    voc: { warning: 300, danger: 500 },
    ammonia: { warning: 15, danger: 30 },
    h2s: { warning: 5, danger: 10 },
  };

const roundTo = (value: number, digits = 1): number =>
  Number.isFinite(value) ? Number(value.toFixed(digits)) : 0;

const average = (values: number[]): number =>
  values.length === 0
    ? 0
    : values.reduce((total, value) => total + value, 0) / values.length;

export const createEmptyHistory = (): SensorHistory =>
  SENSOR_KEYS.reduce((history, key) => {
    history[key] = [];
    return history;
  }, {} as SensorHistory);

export const buildHistory = (
  data: SensorDataPoint[],
  limit = HISTORY_LENGTH
): SensorHistory => {
  const history = createEmptyHistory();
  const recentData = data.slice(-limit);

  recentData.forEach((point) => {
    SENSOR_KEYS.forEach((key) => {
      history[key].push(roundTo(point[key]));
    });
  });

  return history;
};

export const getLatestReading = (data: SensorDataPoint[]): SensorReadings =>
  data.length === 0 ? EMPTY_READINGS : toSensorReadings(data[data.length - 1]);

export const toSensorReadings = (point?: Partial<SensorReadings>): SensorReadings =>
  SENSOR_KEYS.reduce((readings, key) => {
    readings[key] = roundTo(Number(point?.[key] ?? 0));
    return readings;
  }, {} as SensorReadings);

export const calculateSummary = (data: SensorDataPoint[]): SessionSummary => {
  if (data.length === 0) {
    return EMPTY_SUMMARY;
  }

  return {
    totalSamples: data.length,
    avgTemp: roundTo(average(data.map((point) => point.temp)), 2),
    avgHumidity: roundTo(average(data.map((point) => point.humidity)), 2),
    avgAlcohol: roundTo(average(data.map((point) => point.alcohol)), 2),
    avgVoc: roundTo(average(data.map((point) => point.voc)), 2),
    maxAmmonia: roundTo(Math.max(...data.map((point) => point.ammonia)), 2),
    maxH2s: roundTo(Math.max(...data.map((point) => point.h2s)), 2),
    maxTurbidity: roundTo(Math.max(...data.map((point) => point.turbidity)), 2),
  };
};

export const getSensorStatus = (
  sensor: SensorKey,
  value: number
): SensorStatus => {
  const threshold = SENSOR_THRESHOLDS[sensor];

  if (value >= threshold.danger) {
    return 'danger';
  }

  if (value >= threshold.warning) {
    return 'warning';
  }

  return 'good';
};

export const getQuality = (readings: SensorReadings): Quality => {
  const statuses = SENSOR_KEYS.map((key) => getSensorStatus(key, readings[key]));
  const dangerCount = statuses.filter((status) => status === 'danger').length;
  const warningCount = statuses.filter((status) => status === 'warning').length;

  if (dangerCount > 0) {
    return 'unsafe';
  }

  if (warningCount > 0) {
    return 'warning';
  }

  if (SENSOR_KEYS.every((key) => readings[key] === 0)) {
    return 'idle';
  }

  return 'safe';
};

export const getSessionEndTime = (session: SessionRecord): string =>
  session.end_time ?? new Date().toISOString();

export const normalizeTimestamp = (value: string | Date | null): string | null => {
  if (!value) {
    return null;
  }

  return new Date(value).toISOString();
};

export const normalizeSessionRecord = (session: {
  id: string;
  label: string;
  start_time: string | Date;
  end_time: string | Date | null;
}): SessionRecord => ({
  id: session.id,
  label: session.label,
  start_time: normalizeTimestamp(session.start_time) ?? new Date().toISOString(),
  end_time: normalizeTimestamp(session.end_time),
});
