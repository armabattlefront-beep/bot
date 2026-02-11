// commands/leaderboard.js
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getLeaderboard, getUserLevel, getPrestige } = require("../database/xpEngine");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Show the top XP holders in the server")
    .addIntegerOption(option =>
      option.setName("top")
        .setDescription("Number of top users to display")
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      const limit = interaction.options.getInteger("top") || 10;

      const leaderboard = getLeaderboard(limit);
      if (!leaderboard || leaderboard.length === 0) {
        return interaction.reply({ content: "No XP data yet.", flags: 64 });
      }

      const embed = new EmbedBuilder()
        .setTitle("🏆 BattleFront Leaderboard")
        .setColor(0xf1c40f)
        .setTimestamp()
        .setDescription(
          leaderboard.map((entry, i) => {
            const level = getUserLevel(entry.id);
            const prestige = getPrestige(entry.id);
            return `**#${i + 1}** <@${entry.id}> — Level ${level} | Prestige ${prestige} | XP: ${entry.xp.toLocaleString()}`;
          }).join("\n")
        )
        .setFooter({ text: "Climb the ranks, earn prestige, dominate the battlefield!" });

      await interaction.reply({ embeds: [embed] });

    } catch (err) {
      console.error("LEADERBOARD ERROR:", err);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: "❌ Something went wrong fetching the leaderboard.", flags: 64 });
      }
    }
  }
};
