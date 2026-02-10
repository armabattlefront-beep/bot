// database/xp.js
const db = require("./db");

// =============================
// DOUBLE XP
// =============================
let DOUBLE_XP = false;

function toggleDoubleXP(state) {
  DOUBLE_XP = typeof state === "boolean" ? state : !DOUBLE_XP;
  return DOUBLE_XP;
}

function isDoubleXP() {
  return DOUBLE_XP;
}

// =============================
// XP METRICS
// =============================
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

// =============================
// HELPERS
// =============================
function nextLevelXP(level) {
  return 100 + level * 50;
}

// =============================
// GET USER
// =============================
function getUser(userId) {
  const user = db.prepare(`
    SELECT userId, xp, level, prestige
    FROM users
    WHERE userId = ?
  `).get(userId);

  return user || { userId, xp: 0, level: 0, prestige: 0 };
}

// =============================
// ADD XP
// =============================
function addXP(userId, amount) {
  if (!userId || typeof amount !== "number") return;

  if (DOUBLE_XP) amount *= 2;

  let user = getUser(userId);
  user.xp += amount;

  let leveledUp = false;

  while (user.xp >= nextLevelXP(user.level)) {
    user.xp -= nextLevelXP(user.level);
    user.level++;
    leveledUp = true;
  }

  db.prepare(`
    INSERT INTO users (userId, xp, level, prestige)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(userId) DO UPDATE SET
      xp = excluded.xp,
      level = excluded.level,
      prestige = excluded.prestige
  `).run(userId, user.xp, user.level, user.prestige);

  return { ...user, leveledUp };
}

// =============================
// ADMIN SET LEVEL
// =============================
function setLevel(userId, level) {
  db.prepare(`
    INSERT INTO users (userId, xp, level, prestige)
    VALUES (?, 0, ?, 0)
    ON CONFLICT(userId) DO UPDATE SET level = excluded.level
  `).run(userId, level);
}

// =============================
// LEADERBOARD
// =============================
function getLeaderboard(limit = 10) {
  return db.prepare(`
    SELECT userId, xp, level, prestige
    FROM users
    ORDER BY prestige DESC, level DESC, xp DESC
    LIMIT ?
  `).all(limit);
}

// =============================
// RESET USER
// =============================
function resetUser(userId) {
  db.prepare(`DELETE FROM users WHERE userId = ?`).run(userId);
}

// =============================
// EXPORTS
// =============================
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
