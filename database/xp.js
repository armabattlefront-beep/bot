const db = require("./db");

// =======================
// XP CURVE
// =======================
function getNextLevelXP(level) {
  return 100 + level * 50;
}

// =======================
// GET OR CREATE USER
// =======================
function getUser(userId) {
  let user = db
    .prepare("SELECT userId, xp, level FROM users WHERE userId = ?")
    .get(userId);

  if (!user) {
    db.prepare(
      "INSERT INTO users (userId, xp, level) VALUES (?, 0, 0)"
    ).run(userId);

    user = { userId, xp: 0, level: 0 };
  }

  return user;
}

// =======================
// ADD XP
// =======================
function addXP(userId, amount) {
  const user = getUser(userId);

  let xp = user.xp + amount;
  let level = user.level;

  while (xp >= getNextLevelXP(level)) {
    xp -= getNextLevelXP(level);
    level++;
  }

  db.prepare(
    "UPDATE users SET xp = ?, level = ? WHERE userId = ?"
  ).run(xp, level, userId);

  return { xp, level };
}

// =======================
// LEADERBOARD
// =======================
function getLeaderboard(limit = 10) {
  return db.prepare(`
    SELECT userId, xp, level
    FROM users
    ORDER BY level DESC, xp DESC
    LIMIT ?
  `).all(limit);
}

module.exports = {
  getUser,
  addXP,
  getLeaderboard,
  getNextLevelXP
};
