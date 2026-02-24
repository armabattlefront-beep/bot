// serverUpdater.js
const Gamedig = require("gamedig");
const { client } = require("./index");

// List all servers you want to track
// Add as many as you like
const servers = [
  {
    name: "BattleFront Madness",
    ip: "136.243.133.169",
    port: 3002,   // A2S port
    maxPlayers: 128,
    categoryName: "BattleFront Madness Servers",
    refreshInterval: 30_000, // 30 seconds
  },
  // Example for future servers:
  // {
  //   name: "Second Server",
  //   ip: "OTHER_IP",
  //   port: 2303,
  //   maxPlayers: 64,
  //   categoryName: "BattleFront Madness Servers",
  //   refreshInterval: 45_000,
  // },
];

async function initServerUpdater() {
  for (const srv of servers) {
    try {
      // Ensure category exists
      let category = client.channels.cache.find(
        (c) => c.name === srv.categoryName && c.type === 4 // 4 = Category
      );

      if (!category) {
        category = await client.guilds.cache.first().channels.create({
          name: srv.categoryName,
          type: 4,
          reason: "Server updater category",
        });
      }

      // Ensure text channel exists
      let channel = client.channels.cache.find(
        (c) => c.parentId === category.id && c.name.startsWith(srv.name)
      );

      if (!channel) {
        channel = await client.guilds.cache.first().channels.create({
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

          const channelName = `${state.name} (${state.players.length}/${srv.maxPlayers})`;

          if (channel.name !== channelName) {
            await channel.setName(channelName, "Updating player count");
          }

          await channel.setTopic(playerNames);

        } catch (err) {
          console.log(
            `⚠️ Failed to query server "${srv.name}":`,
            err.message
          );
        }
      };

      // Run immediately and then periodically
      updateChannel();
      setInterval(updateChannel, srv.refreshInterval);

    } catch (err) {
      console.error(`❌ Failed to initialize updater for "${srv.name}":`, err);
    }
  }
}

module.exports = { initServerUpdater };