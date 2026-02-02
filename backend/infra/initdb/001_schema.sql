-- Vitae schema 
-- users.id is TEXT (Clerk user id, e.g. "user_abc123")

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,          -- Clerk user id
  email         TEXT UNIQUE,
  full_name     TEXT,
  phone_number  TEXT,
  location      TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS item_types (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name  TEXT NOT NULL,  -- e.g. "Work Experience", "Education", "Research"
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS item_types_user_idx ON item_types(user_id);

CREATE TABLE IF NOT EXISTS canon_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_type_id  UUID NOT NULL REFERENCES item_types(id) ON DELETE CASCADE,
  title         TEXT NOT NULL DEFAULT '',
  position      INT  NOT NULL DEFAULT 0,
  content       JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS canon_items_user_idx ON canon_items(user_id);
CREATE INDEX IF NOT EXISTS canon_items_type_idx ON canon_items(item_type_id);

CREATE TABLE IF NOT EXISTS working_state (
  user_id     TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  state       JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS versions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  snapshot    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS versions_user_idx ON versions(user_id);
CREATE INDEX IF NOT EXISTS versions_user_created_idx ON versions(user_id, created_at DESC);
