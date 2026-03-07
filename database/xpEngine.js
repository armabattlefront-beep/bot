const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "xp.json");

// Load or initialize XP database
let xpDB = {};
if (fs.existsSync(dbPath)) {
  xpDB = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
}

// Save function
function saveDB() {
  fs.writeFileSync(dbPath, JSON.stringify(xpDB, null, 2));
}

// XP logic
function addXP(userId, amount) {
  if (!xpDB[userId]) xpDB[userId] = { xp: 0, level: 0 };
  xpDB[userId].xp += amount;

  const newLevel = calculateLevelFromXP(xpDB[userId].xp);
  if (newLevel > xpDB[userId].level) {
    xpDB[userId].level = newLevel;
    return { levelUp: true, level: newLevel };
  }
  saveDB();
  return { levelUp: false, level: xpDB[userId].level };
}

// Convert XP to Level (simple formula, can adjust)
function calculateLevelFromXP(xp) {
  return Math.floor(0.1 * Math.sqrt(xp)); // Example: sqrt scaling
}

// Get XP and Level for a user
function getUserXP(userId) {
  if (!xpDB[userId]) return { xp: 0, level: 0 };
  return xpDB[userId];
}

// Leaderboard
function getLeaderboard(top = 10) {
  const users = Object.entries(xpDB).map(([id, data]) => ({
    id,
    xp: data.xp,
    level: data.level
  }));
  users.sort((a, b) => b.xp - a.xp);
  return users.slice(0, top);
}

// Reset XP (admin)
function resetXP(userId) {
  if (xpDB[userId]) {
    xpDB[userId] = { xp: 0, level: 0 };
    saveDB();
  }
}

module.exports = {
  addXP,
  getUserXP,
  calculateLevelFromXP,
  getLeaderboard,
  resetXP
};