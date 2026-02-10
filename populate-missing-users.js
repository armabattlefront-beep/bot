// ==================================================
// POPULATE MISSING USERS INTO XP DATABASE
// ==================================================
require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const db = require("./database/db");

if (!process.env.TOKEN) throw new Error("TOKEN not set in .env");

// Create a minimal Discord client for fetching members
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

client.once("ready", async () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
  console.log("🔄 Populating missing users into database...");

  for (const [guildId, guild] of client.guilds.cache) {
    // Fetch all members
    await guild.members.fetch();
    let added = 0;

    guild.members.cache.forEach(member => {
      if (member.user.bot) return; // skip bots

      // Check if user already exists
      const exists = db.prepare(`SELECT 1 FROM users WHERE userId = ?`).get(member.id);
      if (!exists) {
        db.prepare(`INSERT INTO users (userId, xp, level, prestige) VALUES (?, 0, 0, 0)`)
          .run(member.id);
        added++;
      }
    });

    console.log(`✅ Guild "${guild.name}" - added ${added} missing users.`);
  }

  console.log("🎯 Population complete! All users are now in the XP database.");
  process.exit(0); // Exit script
});

client.login(process.env.TOKEN);
