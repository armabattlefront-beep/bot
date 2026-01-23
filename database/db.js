const Database = require("better-sqlite3");

// If you're on Railway, this path is IMPORTANT
const db = new Database("/data/database.db\");

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
