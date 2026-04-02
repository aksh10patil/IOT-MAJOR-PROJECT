CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sensor_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL UNIQUE,
  turbidity DOUBLE PRECISION NOT NULL,
  humidity DOUBLE PRECISION NOT NULL,
  temp DOUBLE PRECISION NOT NULL,
  alcohol DOUBLE PRECISION NOT NULL,
  voc DOUBLE PRECISION NOT NULL,
  ammonia DOUBLE PRECISION NOT NULL,
  h2s DOUBLE PRECISION NOT NULL
);

CREATE INDEX IF NOT EXISTS sessions_start_time_idx
  ON sessions (start_time DESC);

CREATE INDEX IF NOT EXISTS sessions_active_idx
  ON sessions (start_time DESC)
  WHERE end_time IS NULL;

CREATE INDEX IF NOT EXISTS sensor_data_timestamp_idx
  ON sensor_data (timestamp DESC);
