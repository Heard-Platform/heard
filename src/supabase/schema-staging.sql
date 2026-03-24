-- Schema for setting up a new Heard staging Supabase project from scratch.
-- Run this in the Supabase SQL editor before deploying the edge function.
-- After this, run seed-staging.sql to populate test data.

-- Primary data store (KV pattern used by all edge functions)
CREATE TABLE IF NOT EXISTS kv_store_f1a393b4 (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL
);

-- User presence tracking (online/active indicators)
CREATE TABLE IF NOT EXISTS presences (
  "userId" TEXT PRIMARY KEY,
  "currentRoomIndex" INTEGER,
  "avatarAnimal" TEXT,
  "lastUpdated" TIMESTAMPTZ DEFAULT now()
);

-- Content moderation reports
CREATE TABLE IF NOT EXISTS user_reports (
  id SERIAL PRIMARY KEY,
  "reporterId" TEXT,
  "reportedUserId" TEXT,
  "statementId" TEXT,
  "reason" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

-- Email collection from flyer QR campaigns
CREATE TABLE IF NOT EXISTS flyer_emails (
  email TEXT PRIMARY KEY
);

-- Organization signup interest
CREATE TABLE IF NOT EXISTS org_signups (
  email TEXT PRIMARY KEY
);

-- Internal configuration key-value pairs
CREATE TABLE IF NOT EXISTS internal_vars (
  key TEXT PRIMARY KEY,
  value TEXT
);
