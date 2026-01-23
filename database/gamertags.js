const fs = require("fs");
const path = require("path");
const FILE = path.join(__dirname, "gamertags.json");

let users = {};
if (fs.existsSync(FILE)) {
  try { users = JSON.parse(fs.readFileSync(FILE)); } catch { users = {}; }
}

function save() {
  fs.writeFileSync(FILE, JSON.stringify(users, null, 2));
}

/**
 * Register a Discord user with their in-game gamertag
 */
function register(discordId, gamertag) {
  users[discordId] = gamertag;
  save();
}

/**
 * Get Discord ID by gamertag
 */
function getDiscordByGamertag(gamertag) {
  return Object.entries(users).find(([, gt]) => gt.toLowerCase() === gamertag.toLowerCase())?.[0] || null;
}

/**
 * Get gamertag by Discord ID
 */
function getGamertag(discordId) {
  return users[discordId] || null;
}

module.exports = { register, getDiscordByGamertag, getGamertag };
