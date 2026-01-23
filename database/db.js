const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

// =======================
// DATABASE PATH
// =======================
// Use Railway persistent storage or local `data` folder
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "../data");

// Ensure the folder exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Path to the database file
const DB_PATH = path.join(DATA_DIR, "database.db");

// =======================
// OPEN DATABASE
// =======================
const db = new Database(DB_PATH);

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

// Index for fast leaderboard queries
db.prepare(`
  CREATE INDEX IF NOT EXISTS idx_users_xp
  ON users (xp DESC)
`).run();

// =======================
// EXPORT
// =======================
module.exports = db;
