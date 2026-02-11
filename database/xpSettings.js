// database/xpSettings.js
const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "../data/xp.db"));

function getSetting(key) {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key);
  return row ? row.value : null;
}

function setSetting(key, value) {
  db.prepare(`
    INSERT INTO settings (key, value)
    VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value=excluded.value
  `).run(key, value);
}

function getGlobalMultiplier() {
  const val = getSetting("globalMultiplier");
  return val ? parseFloat(val) : 1;
}

function setGlobalMultiplier(multiplier) {
  setSetting("globalMultiplier", multiplier.toString());
}

module.exports = {
  getGlobalMultiplier,
  setGlobalMultiplier
};
