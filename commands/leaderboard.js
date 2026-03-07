const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getTop } = require("../database/xp");
const { getLevelFromXp } = require("../database/levelCurve");
const { getRankName } = require("../xp/ranks");

const rankEmojis = {
  "Recruit": "🟢",
  "Private": "🔵",
  "Lance Corporal": "🟡",
  "Corporal": "🟠",
  "Sergeant": "🔴",
  "Staff Sergeant": "🟣",
  "Warrant Officer": "⚪",
  "Lieutenant": "🟤",
  "Captain": "🏅",
  "Major": "🎖️",
  "Colonel": "⭐",
  "Brigadier": "🌟",
  "General": "🏆",
  "Field Marshal": "🏅"
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("View the top XP leaderboard")
    .addIntegerOption(option =>
      option.setName("top")
        .setDescription("Number of top users to display")
        .setMinValue(1)
        .setMaxValue(50)
    ),
  async execute(interaction) {
    const limit = interaction.options.getInteger("top") || 10;
    const topUsers = getTop(limit); // fetch from DB

    if (!topUsers || topUsers.length === 0) {
      return interaction.reply({ content: "No leaderboard data found.", ephemeral: true });
    }

    let description = "";
    for (let i = 0; i < topUsers.length; i++) {
      const user = topUsers[i];
      const { level, xp, xpNeeded } = getLevelFromXp(user.totalXp);
      const rankName = getRankName(level);
      const rankTier = rankName.split(" •")[0];
      const emoji = rankEmojis[rankTier] || "🎖️";

      // Simple progress bar
      const barLength = 10;
      const progress = Math.floor((xp / xpNeeded) * barLength);
      const bar = "🟩".repeat(progress) + "⬛".repeat(barLength - progress);

      description += `**${i + 1}. <@${user.id}> ${emoji}** — ${rankName} | XP: ${user.totalXp.toLocaleString()}\n${bar}\n`;
    }

    const embed = new EmbedBuilder()
      .setTitle(`🏆 XP Leaderboard - Top ${topUsers.length}`)
      .setDescription(description)
      .setColor(0xffd700)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};