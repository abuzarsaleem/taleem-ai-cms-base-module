-- Taleem AI Base schema bootstrap: extensions, helpers, and migration tracking
CREATE SCHEMA IF NOT EXISTS "taleem-ai-base";

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Time-ordered UUID helper (UUIDv7-style); replace with native PG18 when available
CREATE OR REPLACE FUNCTION "taleem-ai-base".uuid_generate_v7()
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  unix_ts_ms BIGINT;
  uuid_bytes BYTEA;
BEGIN
  unix_ts_ms = (EXTRACT(EPOCH FROM clock_timestamp()) * 1000)::BIGINT;
  uuid_bytes = decode(
    lpad(to_hex(unix_ts_ms), 12, '0') ||
    encode(gen_random_bytes(10), 'hex'),
    'hex'
  );
  RETURN encode(uuid_bytes, 'hex')::UUID;
END;
$$;

CREATE TABLE IF NOT EXISTS "taleem-ai-base".schema_migrations (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) NOT NULL UNIQUE,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
