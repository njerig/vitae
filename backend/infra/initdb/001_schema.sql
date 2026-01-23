-- Vitae: minimal schema (Option A: initdb SQL)
-- Creates: users, oauth_accounts, experiences, experience_bullets

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email             TEXT UNIQUE NOT NULL,
  full_name         TEXT,
  phone_number      TEXT,
  location          TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- OAUTH ACCOUNTS (Google sign-in now; extensible later)
CREATE TABLE IF NOT EXISTS oauth_accounts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider          TEXT NOT NULL,        -- e.g., 'google'
  provider_user_id  TEXT NOT NULL,        -- provider subject / user id
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_user_id),
  UNIQUE (user_id, provider)
);

-- CANONICAL EXPERIENCES
CREATE TABLE IF NOT EXISTS experiences (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,        -- role title
  org               TEXT NOT NULL,        -- company / org
  org_location      TEXT,
  start_date        DATE,
  end_date          DATE,
  is_current        BOOLEAN NOT NULL DEFAULT false,
  summary           TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS experiences_user_id_idx ON experiences(user_id);

-- EXPERIENCE BULLETS
CREATE TABLE IF NOT EXISTS experience_bullets (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id     UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  bullet_text       TEXT NOT NULL,
  position          INT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS experience_bullets_exp_idx ON experience_bullets(experience_id);
