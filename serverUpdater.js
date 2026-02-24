// serverUpdater.js
const { Client } = require("discord.js");
const { Rcon } = require("arma-reforger-rcon");
const { client } = require("./index");

const GUILD_ID = "1332753531764998265"; // Your Discord server ID
const CATEGORY_NAME = "BattleData";
const SERVER_NAME = "BattleFront Madness Server 1";
const MAX_PLAYERS = 128;

const RCON_HOST = process.env.RCON_HOST;
const RCON_PORT = parseInt(process.env.RCON_PORT, 10);
const RCON_PASSWORD = process.env.RCON_PASSWORD;

async function initServerUpdater() {
  try {
    const guild = client.guilds.cache.get(GUILD_ID);
    if (!guild) return console.error("❌ Guild not found");

    // Ensure category exists
    let category = guild.channels.cache.find(
      (c) => c.name === CATEGORY_NAME && c.type === 4
    );
    if (!category) {
      category = await guild.channels.create({
        name: CATEGORY_NAME,
        type: 4, // Category
        reason: "Server updater category",
      });
    }

    // Ensure channel exists
    let channel = guild.channels.cache.find(
      (c) => c.parentId === category.id && c.name.startsWith(SERVER_NAME)
    );
    if (!channel) {
      channel = await guild.channels.create({
        name: `${SERVER_NAME} 0/${MAX_PLAYERS}`,
        type: 0, // Text channel
        parent: category.id,
        reason: "Playerlist updater channel",
      });
    }

    // Connect to RCON
    const rcon = new Rcon({
      host: RCON_HOST,
      port: RCON_PORT,
      password: RCON_PASSWORD,
    });

    await rcon.connect();
    console.log("✅ Connected to Arma Reforger RCON");

    let lastPlayerList = [];
    let lastPlayerCount = -1;

    const updateChannel = async () => {
      try {
        const players = await rcon.getPlayers(); // Returns array of { name, id, ... }
        const currentCount = players.length;
        const playerNames = players.map((p) => p.name).join(", ") || "No players online";

        // Only update if there’s a change
        if (currentCount !== lastPlayerCount || playerNames !== lastPlayerList.join(", ")) {
          lastPlayerCount = currentCount;
          lastPlayerList = players.map((p) => p.name);

          const channelName = `${SERVER_NAME} (${currentCount}/${MAX_PLAYERS})`;
          if (channel.name !== channelName) await channel.setName(channelName, "Updating player count");

          await channel.setTopic(playerNames);
        }
      } catch (err) {
        console.error("⚠️ Failed to query server:", err.message);
      }
    };

    // Run immediately, then every 30s
    updateChannel();
    setInterval(updateChannel, 30_000);

  } catch (err) {
    console.error("❌ Failed to initialise server updater:", err);
  }
}

module.exports = { initServerUpdater };