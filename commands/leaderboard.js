// commands/leaderboard.js
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getLeaderboard } = require("../database/xp");

// =======================
// Get rank name
// =======================
function getRankName(level) {
  const ranks = [
    "Recruit", "Private", "Corporal", "Sergeant", "Lieutenant",
    "Captain", "Major", "Colonel", "General", "Field Marshal"
  ];
  return ranks[Math.min(Math.floor(level / 5), ranks.length - 1)];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Show the top BattleFront ranks!")
    .addIntegerOption(option =>
      option.setName("top")
        .setDescription("Number of top users to show (default 10)")
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      const topCount = interaction.options.getInteger("top") || 10;

      const users = getLeaderboard(topCount);
      if (!users || users.length === 0) {
        return interaction.reply({ content: "No XP data found yet!", ephemeral: true });
      }

      const description = users.map((user, i) => {
        const rankName = getRankName(user.level);
        const nextLevelXP = 100 + user.level * 50;
        return `**${i + 1}. <@${user.userId}>** — ${rankName} | Level ${user.level} | ⭐ ${user.xp} XP / ${nextLevelXP}`;
      }).join("\n");

      const embed = new EmbedBuilder()
        .setTitle("🎖️ BattleFront Leaderboard")
        .setDescription(description)
        .setColor(0x00ff00)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } catch (err) {
      console.error("LEADERBOARD ERROR:", err);
      return interaction.reply({
        content: "❌ Failed to load leaderboard.",
        ephemeral: true
      });
    }
  }
};
