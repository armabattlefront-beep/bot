// database/db.js
const Database = require("better-sqlite3");
const path = require("path");

// Create or open database file
const db = new Database(path.join(__dirname, "database.sqlite"));

// Performance & stability
db.pragma("journal_mode = WAL");

module.exports = db;
