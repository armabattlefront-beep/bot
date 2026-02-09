const fs = require("fs");
const path = require("path");
const db = require("./db");

// =======================
// PATH TO EXISTING JSON XP
// =======================
// Corrected path: levels.json lives one folder up from this script
const LEVELS_PATH = path.join(__dirname, "../levels.json");

// Check if levels.json exists
if (!fs.existsSync(LEVELS_PATH)) {
  console.error("❌ levels.json not found. Migration aborted.");
  process.exit(1);
}

// Load JSON
const levels = JSON.parse(fs.readFileSync(LEVELS_PATH, "utf8"));

let migrated = 0;
let skipped = 0;

// Prepare insert statement (ignore if user already exists)
const insert = db.prepare(`
  INSERT OR IGNORE INTO users (userId, xp, level)
  VALUES (?, ?, ?)
`);

// Loop through all users in JSON
for (const [userId, data] of Object.entries(levels)) {
  const result = insert.run(
    userId,
    Number(data.xp) || 0,
    Number(data.level) || 0
  );

  if (result.changes > 0) migrated++;
  else skipped++;
}

// Migration complete
console.log("✅ XP migration complete");
console.log(`   Migrated: ${migrated}`);
console.log(`   Skipped (already existed): ${skipped}`);
