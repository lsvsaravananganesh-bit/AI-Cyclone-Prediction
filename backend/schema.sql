CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS cyclones (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  year INTEGER,
  region TEXT,
  category TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  max_wind_kmh DOUBLE PRECISION,
  central_pressure_hpa DOUBLE PRECISION,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  source TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS cyclones_name_trgm ON cyclones USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS cyclones_region_trgm ON cyclones USING gin (region gin_trgm_ops);
CREATE INDEX IF NOT EXISTS cyclones_year_idx ON cyclones(year);
CREATE INDEX IF NOT EXISTS cyclones_start_idx ON cyclones(start_time DESC);

CREATE TABLE IF NOT EXISTS cyclone_track_points (
  id BIGSERIAL PRIMARY KEY,
  cyclone_id BIGINT REFERENCES cyclones(id) ON DELETE CASCADE,
  observed_at TIMESTAMPTZ NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  wind_kmh DOUBLE PRECISION,
  pressure_hpa DOUBLE PRECISION,
  point_type TEXT NOT NULL CHECK(point_type IN ('observed','forecast','ai_prediction')),
  confidence DOUBLE PRECISION,
  source TEXT
);
CREATE INDEX IF NOT EXISTS track_cyclone_time_idx ON cyclone_track_points(cyclone_id,observed_at);

CREATE TABLE IF NOT EXISTS analyses (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  filename TEXT,
  image_type TEXT,
  model_version TEXT,
  classification TEXT,
  confidence DOUBLE PRECISION,
  intensity_kmh DOUBLE PRECISION,
  metadata JSONB DEFAULT '{}'::jsonb
);
