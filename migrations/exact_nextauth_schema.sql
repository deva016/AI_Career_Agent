-- EXACT NextAuth v4 PostgreSQL Adapter Schema
-- Reference: https://authjs.dev/reference/adapter/pg

-- Backup existing users if any
CREATE TABLE IF NOT EXISTS users_backup AS SELECT * FROM users WHERE 1=0;
INSERT INTO users_backup SELECT * FROM users ON CONFLICT DO NOTHING;

-- Drop all auth tables
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS verification_tokens CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table EXACTLY as NextAuth expects
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  "emailVerified" TIMESTAMPTZ,
  image TEXT
);

-- Create accounts table EXACTLY as NextAuth expects
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  UNIQUE(provider, "providerAccountId")
);

-- Create sessions table EXACTLY as NextAuth expects
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "sessionToken" TEXT NOT NULL UNIQUE,
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMPTZ NOT NULL
);

-- Create verification_tokens table EXACTLY as NextAuth expects
CREATE TABLE verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- Create indexes for performance
CREATE INDEX idx_accounts_userId ON accounts("userId");
CREATE INDEX idx_sessions_userId ON sessions("userId");
CREATE INDEX idx_sessions_sessionToken ON sessions("sessionToken");
