import pool from './db.js';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS events (
  id           TEXT PRIMARY KEY,
  title        TEXT NOT NULL DEFAULT '',
  description  TEXT DEFAULT '',
  location     TEXT DEFAULT '',
  date         TEXT DEFAULT '',
  time         TEXT DEFAULT '',
  audience     TEXT DEFAULT '',
  category     TEXT DEFAULT '',
  map_url      TEXT DEFAULT '',
  active       BOOLEAN DEFAULT true,
  tone         TEXT DEFAULT 'green',
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contents (
  id           TEXT PRIMARY KEY,
  title        TEXT NOT NULL DEFAULT '',
  type         TEXT DEFAULT 'post',
  summary      TEXT DEFAULT '',
  category     TEXT DEFAULT '',
  action_label TEXT DEFAULT '',
  file_url     TEXT DEFAULT '',
  active       BOOLEAN DEFAULT true,
  updated_at   TEXT DEFAULT '',
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS keywords (
  id           TEXT PRIMARY KEY,
  question     TEXT DEFAULT '',
  keywords     TEXT[] DEFAULT '{}',
  answer       TEXT DEFAULT '',
  link_label   TEXT DEFAULT '',
  link_url     TEXT DEFAULT '',
  image_url    TEXT DEFAULT '',
  cta_label    TEXT DEFAULT '',
  cta_url      TEXT DEFAULT '',
  active       BOOLEAN DEFAULT true,
  updated_at   TEXT DEFAULT '',
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS doctor_questions (
  id           TEXT PRIMARY KEY,
  question     TEXT NOT NULL DEFAULT '',
  answer       TEXT NOT NULL DEFAULT '',
  keywords     TEXT[] DEFAULT '{}',
  active       BOOLEAN DEFAULT true,
  sort_order   INTEGER DEFAULT 999,
  updated_at   TEXT DEFAULT '',
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS qr_locations (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL DEFAULT '',
  description  TEXT DEFAULT '',
  slug         TEXT UNIQUE NOT NULL,
  active       BOOLEAN DEFAULT true,
  scans        INTEGER DEFAULT 0,
  last_scan_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS smart_entry_config (
  id         INTEGER PRIMARY KEY DEFAULT 1,
  config     JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);
`;

export async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(SCHEMA);
    console.log('[migrate] ✓ Schema ready');
  } catch (err) {
    console.error('[migrate] ✗ Failed:', err.message);
    throw err;
  } finally {
    client.release();
  }
}
