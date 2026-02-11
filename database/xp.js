// database/xp.js
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const DATA_DIR = path.join(__dirname, "../data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, "xp.db"));

// ==============================
// TABLES
// ==============================

db.prepare(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  prestige INTEGER DEFAULT 0,
  totalXp INTEGER DEFAULT 0,
  lastMessage INTEGER DEFAULT 0,
  lastVoice INTEGER DEFAULT 0,
  messages INTEGER DEFAULT 0,
  voiceMinutes INTEGER DEFAULT 0,
  reactionsGiven INTEGER DEFAULT 0,
  reactionsReceived INTEGER DEFAULT 0
)
`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS xp_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId TEXT,
  amount INTEGER,
  reason TEXT,
  timestamp INTEGER
)
`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
)
`).run();

// ==============================
// USER FUNCTIONS
// ==============================

function getUser(id) {
  let user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);

  if (!user) {
    db.prepare("INSERT INTO users (id) VALUES (?)").run(id);
    user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
  }

  return user;
}

function updateUser(id, updates) {
  const user = getUser(id);
  const merged = { ...user, ...updates };

  db.prepare(`
    UPDATE users SET
      xp=@xp,
      level=@level,
      prestige=@prestige,
      totalXp=@totalXp,
      lastMessage=@lastMessage,
      lastVoice=@lastVoice,
      messages=@messages,
      voiceMinutes=@voiceMinutes,
      reactionsGiven=@reactionsGiven,
      reactionsReceived=@reactionsReceived
    WHERE id=@id
  `).run({ ...merged, id });
}

function logXP(userId, amount, reason) {
  db.prepare(`
    INSERT INTO xp_events (userId, amount, reason, timestamp)
    VALUES (?, ?, ?, ?)
  `).run(userId, amount, reason, Date.now());
}

function getTop(limit = 10) {
  return db.prepare(`
    SELECT * FROM users
    ORDER BY prestige DESC, level DESC, xp DESC
    LIMIT ?
  `).all(limit);
}

module.exports = {
  getUser,
  updateUser,
  logXP,
  getTop
};
