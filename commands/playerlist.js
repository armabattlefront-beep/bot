// commands/playerlist.js
const Gamedig = require("gamedig");
const { client } = require("../index");
const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("playerlist")
    .setDescription("Starts updating the playerlist in a dedicated channel"),

  async execute(interaction) {
    await interaction.reply({ content: "✅ Playerlist updater started!", ephemeral: true });

    // Channel setup
    let channel = interaction.guild.channels.cache.find(
      (c) => c.name.includes("BattleFront") && c.type === 0 // 0 = text channel
    );

    // Create channel if it doesn’t exist
    if (!channel) {
      channel = await interaction.guild.channels.create({
        name: "BattleFront 0/128",
        type: 0,
        reason: "Playerlist updater channel",
      });
    }

    const SERVER_IP = "YOUR_SERVER_IP"; // change to your Arma Reforger server IP
    const SERVER_PORT = 2303;           // your A2S port
    const MAX_PLAYERS = 128;            // max players

    // Function to update channel
    const updateChannel = async () => {
      try {
        const state = await Gamedig.query({
          type: "arma3",
          host: SERVER_IP,
          port: SERVER_PORT,
        });

        const players = state.players.map((p) => p.name).join(", ") || "No players online";
        const channelName = `${state.name} (${state.players.length}/${MAX_PLAYERS})`;

        if (channel.name !== channelName) {
          await channel.setName(channelName, "Updating player count");
        }

        // Update topic with player names
        await channel.setTopic(players);

      } catch (err) {
        console.log("⚠️ Failed to query server:", err.message);
      }
    };

    // Run immediately and then every 30s
    updateChannel();
    setInterval(updateChannel, 30_000);
  },
};