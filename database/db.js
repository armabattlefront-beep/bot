const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

// =======================
// DATABASE PATH
// =======================
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "../data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, "database.db");

// =======================
// OPEN DATABASE
// =======================
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

// =======================
// CREATE TABLES
// =======================
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    userId TEXT PRIMARY KEY,
    xp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 0
  )
`).run();

// Index for leaderboard speed
db.prepare(`
  CREATE INDEX IF NOT EXISTS idx_users_level_xp
  ON users (level DESC, xp DESC)
`).run();

module.exports = db;
