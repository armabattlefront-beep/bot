const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

// =======================
// DATABASE PATH
// =======================
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "../data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, "database.db");

// =======================
// OPEN DATABASE
// =======================
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

// =======================
// CREATE / UPDATE TABLES
// =======================

// Base users table (new installs)
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    userId TEXT PRIMARY KEY,
    xp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 0,
    prestige INTEGER NOT NULL DEFAULT 0
  )
`).run();

// =======================
// MIGRATIONS (SAFE UPDATES)
// =======================

// Check existing columns
const columns = db.prepare(`PRAGMA table_info(users)`).all();
const columnNames = columns.map(col => col.name);

// Add prestige column if missing (OLD DATABASE FIX)
if (!columnNames.includes("prestige")) {
  console.log("🔧 DB Migration: Adding prestige column to users table");
  db.prepare(`
    ALTER TABLE users
    ADD COLUMN prestige INTEGER NOT NULL DEFAULT 0
  `).run();
}

// =======================
// INDEXES
// =======================

// Leaderboard performance index
db.prepare(`
  CREATE INDEX IF NOT EXISTS idx_users_level_xp
  ON users (level DESC, xp DESC)
`).run();

module.exports = db;
