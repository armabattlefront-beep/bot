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

db.exec(`

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
);

CREATE TABLE IF NOT EXISTS xp_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId TEXT,
  amount INTEGER,
  reason TEXT,
  timestamp INTEGER
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

`);


// ==============================
// PERFORMANCE INDEXES
// ==============================

db.exec(`

CREATE INDEX IF NOT EXISTS idx_totalXp
ON users(totalXp DESC);

CREATE INDEX IF NOT EXISTS idx_level
ON users(level DESC);

`);


// ==============================
// USER FUNCTIONS
// ==============================

function getUser(id) {

  let user = db.prepare(
    "SELECT * FROM users WHERE id = ?"
  ).get(id);

  if (!user) {

    db.prepare(
      "INSERT INTO users (id) VALUES (?)"
    ).run(id);

    user = db.prepare(
      "SELECT * FROM users WHERE id = ?"
    ).get(id);
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


// ==============================
// XP LOGGING
// ==============================

function logXP(userId, amount, reason) {

  db.prepare(`
    INSERT INTO xp_events (userId, amount, reason, timestamp)
    VALUES (?, ?, ?, ?)
  `).run(userId, amount, reason, Date.now());

}


// ==============================
// LEADERBOARD
// ==============================

function getTop(limit = 10) {

  return db.prepare(`
    SELECT *
    FROM users
    ORDER BY prestige DESC, totalXp DESC
    LIMIT ?
  `).all(limit);

}


// ==============================
// USER RANK POSITION
// ==============================

function getRankPosition(userId) {

  const user = getUser(userId);

  const result = db.prepare(`
    SELECT COUNT(*) + 1 as rank
    FROM users
    WHERE totalXp > ?
  `).get(user.totalXp);

  return result.rank;
}


// ==============================
// XP GIFTING
// ==============================

function giftXP(fromId, toId, amount) {

  const sender = getUser(fromId);
  const receiver = getUser(toId);

  if (amount <= 0) return { error: "Invalid amount." };

  const maxGift = Math.floor(sender.totalXp * 0.15);

  if (amount > maxGift) {
    return { error: `Max gift is ${maxGift} XP.` };
  }

  if (sender.totalXp < amount) {
    return { error: "Not enough XP." };
  }

  updateUser(fromId, {
    totalXp: sender.totalXp - amount
  });

  updateUser(toId, {
    totalXp: receiver.totalXp + amount
  });

  logXP(fromId, -amount, "gift_sent");
  logXP(toId, amount, "gift_received");

  return { success: true };

}


// ==============================
// EXPORTS
// ==============================

module.exports = {
  getUser,
  updateUser,
  logXP,
  getTop,
  getRankPosition,
  giftXP
};