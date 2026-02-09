// database/xp.js
const db = require("./db");

// -----------------------------
// DOUBLE XP TOGGLE
// -----------------------------
let DOUBLE_XP = false;

function toggleDoubleXP(state) {
  if (typeof state === "boolean") {
    DOUBLE_XP = state;
  } else {
    DOUBLE_XP = !DOUBLE_XP;
  }
  return DOUBLE_XP;
}

function isDoubleXP() {
  return DOUBLE_XP;
}

// -----------------------------
// XP METRICS CONFIG
// -----------------------------
// Defines how much XP is awarded per action
const XP_METRICS = {
  message: 5,
  reaction: 2,
  image: 3,
  video: 5,
  voiceMinute: 1,
  ticketSubmit: 10,
  ticketResolved: 15
};

function getMetrics() {
  return XP_METRICS;
}

// -----------------------------
// GET USER
// -----------------------------
function getUser(userId) {
  const row = db.prepare("SELECT * FROM users WHERE userId = ?").get(userId);
  return row || { userId, xp: 0, level: 0, prestige: 0 };
}

// -----------------------------
// ADD XP
// -----------------------------
function addXP(userId, amount, options = {}) {
  if (!userId || typeof amount !== "number") return;

  if (DOUBLE_XP) amount *= 2;

  let user = getUser(userId);

  user.xp += amount;

  // Auto-level up loop
  let leveledUp = false;
  while (user.xp >= nextLevelXP(user.level)) {
    user.xp -= nextLevelXP(user.level);
    user.level += 1;
    leveledUp = true;
  }

  // Save to DB
  db.prepare(`
    INSERT INTO users (userId, xp, level, prestige)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(userId) DO UPDATE SET xp = excluded.xp, level = excluded.level
  `).run(userId, user.xp, user.level, user.prestige || 0);

  return { ...user, leveledUp };
}

// -----------------------------
// CALCULATE NEXT LEVEL XP
// -----------------------------
function nextLevelXP(level) {
  // Simple linear: 100 + 50 per level
  return 100 + level * 50;
}

// -----------------------------
// SET LEVEL (ADMIN)
// -----------------------------
function setLevel(userId, level) {
  let user = getUser(userId);
  if (!user) {
    db.prepare("INSERT INTO users (userId, xp, level, prestige) VALUES (?, ?, ?, ?)").run(userId, 0, level, 0);
  } else {
    db.prepare("UPDATE users SET level = ? WHERE userId = ?").run(level, userId);
  }
}

// -----------------------------
// GET LEADERBOARD
// -----------------------------
function getLeaderboard(limit = 10) {
  return db.prepare(`
    SELECT * FROM users
    ORDER BY level DESC, xp DESC
    LIMIT ?
  `).all(limit);
}

// -----------------------------
// RESET USER (ADMIN)
// -----------------------------
function resetUser(userId) {
  db.prepare("DELETE FROM users WHERE userId = ?").run(userId);
}

// -----------------------------
// EXPORTS
// -----------------------------
module.exports = {
  getUser,
  addXP,
  setLevel,
  getLeaderboard,
  toggleDoubleXP,
  isDoubleXP,
  nextLevelXP,
  getMetrics,
  resetUser
};
