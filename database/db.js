const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

// Use a data folder relative to the project root
const dataDir = path.join(__dirname, "../data");

// Create the folder if it doesn't exist
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// Path to the database file
const dbPath = path.join(dataDir, "database.db");

// Open the database
const db = new Database(dbPath);

// Create users table if it doesn't exist
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    userId TEXT PRIMARY KEY,
    xp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 0
  )
`).run();

// Index for fast leaderboards
db.prepare(`
  CREATE INDEX IF NOT EXISTS idx_users_xp
  ON users (xp DESC)
`).run();

module.exports = db;
