const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const db = new Database(path.join(__dirname, '../../timefocus_api.db'));

// ── Crear tablas ──────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS developers (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    email       TEXT    NOT NULL UNIQUE,
    password    TEXT    NOT NULL,
    created_at  TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS api_keys (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    developer_id INTEGER NOT NULL,
    key_value    TEXT    NOT NULL UNIQUE,
    name         TEXT    DEFAULT 'Mi App',
    active       INTEGER DEFAULT 1,
    requests     INTEGER DEFAULT 0,
    created_at   TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (developer_id) REFERENCES developers(id)
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    developer_id INTEGER NOT NULL,
    title        TEXT    NOT NULL,
    description  TEXT,
    status       TEXT    DEFAULT 'pending',
    priority     TEXT    DEFAULT 'medium',
    due_date     TEXT,
    subject      TEXT,
    created_at   TEXT    DEFAULT (datetime('now')),
    updated_at   TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (developer_id) REFERENCES developers(id)
  );

  CREATE TABLE IF NOT EXISTS study_sessions (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    developer_id      INTEGER NOT NULL,
    date              TEXT    NOT NULL,
    start_time        TEXT,
    end_time          TEXT,
    duration_minutes  INTEGER NOT NULL,
    type              TEXT    DEFAULT 'study',
    subject           TEXT,
    created_at        TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (developer_id) REFERENCES developers(id)
  );
`);

// ── Helpers ───────────────────────────────────────────────────────
const generateApiKey = () => {
  const prefix = 'tf_live_';
  const random = crypto.randomBytes(24).toString('hex');
  return `${prefix}${random}`;
};

module.exports = { db, generateApiKey };
