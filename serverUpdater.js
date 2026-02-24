// serverUpdater.js
const Gamedig = require("gamedig");
const { client } = require("./index");

// === CONFIGURE YOUR SERVER ===
const guildId = "1332753531764998265"; // Your Discord server (guild) ID
const servers = [
  {
    name: "BattleFront Madness Server 1",
    ip: "136.243.133.169",
    port: 3002, // A2S port
    maxPlayers: 128,
    categoryName: "BattleData",
    refreshInterval: 30_000, // 30 seconds
  },
];

async function initServerUpdater() {
  const guild = client.guilds.cache.get(guildId);
  if (!guild) {
    console.error("❌ Could not find guild with ID:", guildId);
    return;
  }

  for (const srv of servers) {
    try {
      // Ensure category exists
      let category = guild.channels.cache.find(
        (c) => c.name === srv.categoryName && c.type === 4 // 4 = Category
      );

      if (!category) {
        category = await guild.channels.create({
          name: srv.categoryName,
          type: 4,
          reason: "Server updater category",
        });
      }

      // Ensure text channel exists
      let channel = guild.channels.cache.find(
        (c) => c.parentId === category.id && c.name.startsWith(srv.name)
      );

      if (!channel) {
        channel = await guild.channels.create({
          name: `${srv.name} 0/${srv.maxPlayers}`,
          type: 0, // 0 = text channel
          parent: category.id,
          reason: "Playerlist updater channel",
        });
      }

      // Function to update channel safely
      const updateChannel = async () => {
        try {
          const state = await Gamedig.query({
            type: "arma3",
            host: srv.ip,
            port: srv.port,
          });

          const playerNames =
            state.players.map((p) => p.name).join(", ") || "No players online";

          const channelName = `${srv.name} (${state.players.length}/${srv.maxPlayers})`;

          if (channel.name !== channelName) {
            await channel.setName(channelName, "Updating player count");
          }

          await channel.setTopic(playerNames);
        } catch (err) {
          // Server might be offline
          const offlineName = `${srv.name} (0/${srv.maxPlayers})`;
          if (channel.name !== offlineName) {
            await channel.setName(offlineName, "Server offline or unreachable");
          }
          await channel.setTopic("Server is offline or unreachable");
          console.log(`⚠️ Failed to query server "${srv.name}":`, err.message);
        }
      };

      // Run immediately and then periodically
      updateChannel();
      setInterval(updateChannel, srv.refreshInterval);
    } catch (err) {
      console.error(`❌ Failed to initialise updater for "${srv.name}":`, err);
    }
  }
}

module.exports = { initServerUpdater };