const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getLeaderboard } = require("../database/xpEngine");

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
    const limit = interaction.options.getInteger("top") || 10;
    const leaderboard = getLeaderboard(limit);

    if (!leaderboard || leaderboard.length === 0)
      return interaction.reply({ content: "No XP data yet.", ephemeral: true });

    const embed = new EmbedBuilder()
      .setTitle("🏆 BattleFront Leaderboard")
      .setColor(0xf1c40f)
      .setTimestamp()
      .setDescription(
        leaderboard.map((entry, i) => {
          return `**#${i + 1}** <@${entry.id}> — Level ${entry.level} | XP: ${entry.xp} | Prestige: ${entry.prestige}`;
        }).join("\n")
      );

    await interaction.reply({ embeds: [embed] });
  }
};
