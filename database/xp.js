const db = require("./db");

function getUser(userId) {
  let user = db
    .prepare("SELECT * FROM users WHERE userId = ?")
    .get(userId);

  if (!user) {
    db.prepare(
      "INSERT INTO users (userId, xp, level) VALUES (?, 0, 0)"
    ).run(userId);

    user = { userId, xp: 0, level: 0 };
  }

  return user;
}

function addXP(userId, amount) {
  const user = getUser(userId);
  const newXP = user.xp + amount;

  db.prepare(
    "UPDATE users SET xp = ? WHERE userId = ?"
  ).run(newXP, userId);

  return newXP;
}

function setLevel(userId, level) {
  db.prepare(
    "UPDATE users SET level = ? WHERE userId = ?"
  ).run(level, userId);
}

module.exports = {
  getUser,
  addXP,
  setLevel
};
