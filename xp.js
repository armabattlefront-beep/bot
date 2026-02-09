/**
 * WARNING: This file used to manage XP via levels.json.
 * It is now a wrapper that points to the DB-based XP system.
 * No JSON writes will occur here anymore.
 */

const xpDB = require("../database/xp"); // <-- use the new SQLite XP system

module.exports = xpDB;
