-- Minimal bootstrap: creates admin_users so login works immediately.
-- Full schema (schema.sql) is applied right after when possible.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO admin_users (username, password_hash)
VALUES ('SUiTsOcIety', '$2a$12$ZUXHgk5BeFwFTMcQ9fVK0.j3B2Vwico0o6iC7oBi3Q1wQRQgbw/ja')
ON CONFLICT (username) DO NOTHING;
