const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { sendRconCommand } = require("../rconClient");
const { STAFF_ROLE_IDS } = require("../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("serverstatus")
    .setDescription("Shows Arma Reforger server status and player list"),

  async execute(interaction) {
    if (!STAFF_ROLE_IDS.includes(interaction.user.id)) {
      return interaction.reply({ content: "🚫 Staff only.", ephemeral: true });
    }

    await interaction.deferReply();

    try {
      const [playerList, uptime, map] = await Promise.all([
        sendRconCommand("#userlist"),
        sendRconCommand("#uptime"),
        sendRconCommand("#mission")
      ]);

      const embed = new EmbedBuilder()
        .setTitle("🎮 Arma Reforger Server Status")
        .setColor(0x1abc9c)
        .addFields(
          { name: "Uptime", value: uptime || "Unknown", inline: true },
          { name: "Map/Mission", value: map || "Unknown", inline: true },
          { name: "Players Online", value: playerList || "None" }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error("❌ /serverstatus failed:", err);
      if (!interaction.replied) {
        await interaction.editReply({ content: "❌ Failed to fetch server status." });
      }
    }
  }
};
