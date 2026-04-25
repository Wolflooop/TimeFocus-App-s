const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, '../../timefocus_api.db');

const db = new Database(DB_PATH);
console.log('Conectado a SQLite');

db.exec(`CREATE TABLE IF NOT EXISTS developers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

db.exec(`CREATE TABLE IF NOT EXISTS api_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  developer_id INTEGER NOT NULL,
  key_value TEXT UNIQUE NOT NULL,
  name TEXT DEFAULT 'Default Key',
  active INTEGER DEFAULT 1,
  requests INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (developer_id) REFERENCES developers(id)
)`);

const generateApiKey = () => {
  return 'tf_live_' + crypto.randomBytes(24).toString('hex');
};

module.exports = { db, generateApiKey };