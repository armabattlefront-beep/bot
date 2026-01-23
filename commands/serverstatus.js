// commands/serverstatus.js
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { sendRconCommand } = require("../rconClient");
const { isStaff } = require("../utils/permissions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("serverstatus")
    .setDescription("Shows Arma Reforger server status and player list"),

  async execute(interaction) {
    if (!isStaff(interaction.member)) 
      return interaction.reply({ content: "🚫 Staff only.", ephemeral: true });

    await interaction.deferReply();

    try {
      const uptime = await sendRconCommand("#uptime") || "Unknown";
      const map = await sendRconCommand("#mission") || "Unknown";
      const rawPlayers = await sendRconCommand("#userlist") || "";

      // Parse player list
      const players = rawPlayers
        .split("\n")
        .map(line => line.trim())
        .filter(line => line)
        .map(line => {
          // Format: "Player# GUID Name Score ..."
          const parts = line.split(/\s+/);
          return {
            id: parts[1] || "Unknown",
            name: parts[2] || parts[0] || "Unknown",
            score: parts[3] || "0"
          };
        });

      const playerCount = players.length;
      const topPlayers = players.slice(0, 10).map(p => `${p.name} (${p.id}) - Score: ${p.score}`).join("\n") || "No players online";

      const embed = new EmbedBuilder()
        .setTitle("🎮 Arma Reforger Server Status")
        .setColor(0x1abc9c)
        .addFields(
          { name: "Uptime", value: uptime, inline: true },
          { name: "Map/Mission", value: map, inline: true },
          { name: "Players Online", value: `${playerCount}`, inline: true },
          { name: "Top Players", value: topPlayers }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

      // Auto-update every 60 seconds
      const interval = setInterval(async () => {
        const uptime = await sendRconCommand("#uptime") || "Unknown";
        const map = await sendRconCommand("#mission") || "Unknown";
        const rawPlayers = await sendRconCommand("#userlist") || "";

        const players = rawPlayers
          .split("\n")
          .map(line => line.trim())
          .filter(line => line)
          .map(line => {
            const parts = line.split(/\s+/);
            return { id: parts[1] || "Unknown", name: parts[2] || parts[0] || "Unknown", score: parts[3] || "0" };
          });

        const playerCount = players.length;
        const topPlayers = players.slice(0, 10).map(p => `${p.name} (${p.id}) - Score: ${p.score}`).join("\n") || "No players online";

        const updatedEmbed = new EmbedBuilder()
          .setTitle("🎮 Arma Reforger Server Status (Live)")
          .setColor(0x1abc9c)
          .addFields(
            { name: "Uptime", value: uptime, inline: true },
            { name: "Map/Mission", value: map, inline: true },
            { name: "Players Online", value: `${playerCount}`, inline: true },
            { name: "Top Players", value: topPlayers }
          )
          .setTimestamp();

        try {
          await interaction.editReply({ embeds: [updatedEmbed] });
        } catch {
          clearInterval(interval); // stop updating if message deleted
        }
      }, 60000);

    } catch (err) {
      console.error("Serverstatus error:", err);
      interaction.editReply({ content: "❌ Failed to fetch server status." });
    }
  }
};
