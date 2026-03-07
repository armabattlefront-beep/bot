const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getLeaderboard } = require("../database/xpEngine");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Shows the top XP users")
    .addIntegerOption(option =>
      option
        .setName("top")
        .setDescription("Number of users to display")
        .setMinValue(1)
        .setMaxValue(50)
    ),

  async execute(interaction) {
    const topN = interaction.options.getInteger("top") || 10;
    const leaderboard = getLeaderboard(topN);

    if (leaderboard.length === 0) {
      return interaction.reply({ content: "No XP data available yet.", ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle(`🏆 Top ${leaderboard.length} XP Users`)
      .setColor(0xf1c40f)
      .setTimestamp();

    let description = "";
    for (let i = 0; i < leaderboard.length; i++) {
      const user = await interaction.guild.members.fetch(leaderboard[i].id).catch(() => null);
      const username = user ? user.user.username : "Unknown User";
      description += `**#${i + 1}** • ${username} — Level ${leaderboard[i].level} | XP ${leaderboard[i].xp}\n`;
    }

    embed.setDescription(description);
    await interaction.reply({ embeds: [embed] });
  },
};