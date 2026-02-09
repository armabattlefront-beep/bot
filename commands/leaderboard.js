const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getLeaderboard } = require("../database/xp");

// =======================
// GET RANK NAME BY LEVEL
// =======================
function getRankName(level) {
  const ranks = [
    "Recruit",
    "Private",
    "Corporal",
    "Sergeant",
    "Lieutenant",
    "Captain",
    "Major",
    "Colonel",
    "General",
    "Field Marshal"
  ];
  return ranks[Math.min(level, ranks.length - 1)];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Show the top BattleFront ranks!")
    .addIntegerOption(option =>
      option
        .setName("top")
        .setDescription("Number of top users to show (default 10)")
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      const topCount = interaction.options.getInteger("top") || 10;

      // fetch leaderboard from DB
      const users = getLeaderboard(topCount);

      if (!users || users.length === 0) {
        return interaction.reply({ content: "No XP data found yet!", ephemeral: true });
      }

      // build embed description
      let description = "";
      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        description += `**${i + 1}. <@${user.userId}>** — ${getRankName(user.level)} | Level ${user.level} | ⭐ ${user.xp} XP\n`;
      }

      const embed = new EmbedBuilder()
        .setTitle("🎖️ BattleFront Leaderboard")
        .setDescription(description)
        .setColor(0x00ff00)
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    } catch (err) {
      console.error("LEADERBOARD ERROR:", err);
      return interaction.reply({
        content: "❌ Failed to load leaderboard.",
        ephemeral: true
      });
    }
  }
};
