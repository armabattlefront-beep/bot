const fs = require("fs");
const path = require("path");
const db = require("./db");

// =======================
// JSON SOURCE
// =======================
const LEVELS_PATH = path.join(__dirname, "../levels.json");

if (!fs.existsSync(LEVELS_PATH)) {
  console.error("❌ levels.json not found");
  process.exit(1);
}

const levels = JSON.parse(fs.readFileSync(LEVELS_PATH, "utf8"));

let migrated = 0;

// =======================
// UPSERT (NOT IGNORE)
// =======================
const upsert = db.prepare(`
  INSERT INTO users (userId, xp, level, prestige)
  VALUES (?, ?, ?, 0)
  ON CONFLICT(userId) DO UPDATE SET
    xp = excluded.xp,
    level = excluded.level
`);

for (const [userId, data] of Object.entries(levels)) {
  upsert.run(
    userId,
    Number(data.xp) || 0,
    Number(data.level) || 0
  );
  migrated++;
}

console.log("✅ XP migration complete");
console.log(`   Updated users: ${migrated}`);
