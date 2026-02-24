// serverUpdater.js
const WebSocket = require("ws");

// Your server configuration
const serverConfig = {
  guildId: "1332753531764998265", // Discord server ID
  categoryName: "BattleData",
  serverName: "BattleFront Madness Server 1",
  ip: "136.243.133.169",
  rconPort: 3002,
  rconPassword: process.env.REFORGER_RCON, // set this in .env
  maxPlayers: 128,
  refreshInterval: 30_000 // 30 seconds
};

async function initServerUpdater(client) {
  try {
    const guild = await client.guilds.fetch(serverConfig.guildId);
    if (!guild) throw new Error("Guild not found");

    // Create or fetch category
    let category = guild.channels.cache.find(
      (c) => c.name === serverConfig.categoryName && c.type === 4
    );

    if (!category) {
      category = await guild.channels.create({
        name: serverConfig.categoryName,
        type: 4,
        reason: "Server updater category"
      });
    }

    // Create or fetch text channel
    let channel = guild.channels.cache.find(
      (c) => c.parentId === category.id && c.name.startsWith(serverConfig.serverName)
    );

    if (!channel) {
      channel = await guild.channels.create({
        name: `${serverConfig.serverName} 0/${serverConfig.maxPlayers}`,
        type: 0, // Text channel
        parent: category.id,
        reason: "Playerlist updater channel"
      });
    }

    // Connect to Reforger RCON via WebSocket
    const ws = new WebSocket(`ws://${serverConfig.ip}:${serverConfig.rconPort}`);

    ws.on("open", () => {
      console.log("🌐 Connected to Reforger RCON");
      ws.send(JSON.stringify({ type: "auth", password: serverConfig.rconPassword }));
    });

    ws.on("message", async (data) => {
      try {
        const msg = JSON.parse(data);
        if (msg.type === "auth_response" && msg.success) {
          console.log("✅ RCON authenticated");
        }

        // Example: receive player list updates from RCON
        if (msg.type === "player_list") {
          const playerCount = msg.players.length;
          const playerNames = msg.players.map(p => p.name).join(", ") || "No players online";

          // Update channel name & topic
          await channel.setName(`${serverConfig.serverName} (${playerCount}/${serverConfig.maxPlayers})`);
          await channel.setTopic(playerNames);
        }
      } catch (err) {
        console.error("⚠️ Failed to process RCON message:", err);
      }
    });

    ws.on("error", (err) => console.error("❌ RCON connection error:", err));
    ws.on("close", () => console.log("ℹ️ RCON connection closed"));

    // Optional: request player list periodically
    setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "get_players" }));
      }
    }, serverConfig.refreshInterval);

  } catch (err) {
    console.error("❌ Failed to initialise server updater:", err);
  }
}

module.exports = { initServerUpdater };