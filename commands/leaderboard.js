const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getUser } = require("../database/xp");
const db = require("../database/db");

// Function to get rank name by level
function getRankName(level) {
  const ranks = ["Recruit", "Private", "Corporal", "Sergeant", "Lieutenant", "Captain", "Major", "Colonel", "General"];
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
      // Optional top N parameter
      const topCount = interaction.options.getInteger("top") || 10;

      // Query all users from the DB
      const users = db.prepare("SELECT * FROM users ORDER BY level DESC, xp DESC LIMIT ?").all(topCount);

      if (!users || users.length === 0) {
        return interaction.reply("No XP data found yet!");
      }

      // Build embed description
      let description = "";
      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        description += `**${i + 1}. <@${user.userId}>** — ${getRankName(user.level)} | Level ${user.level} | ⭐ ${user.xp} XP\n`;
      }

      const embed = new EmbedBuilder()
        .setTitle("🎖️ BattleFront Leaderboard")
        .setColor("#00FF00")
        .setDescription(description)
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    } catch (err) {
      console.error("❌ Leaderboard command error:", err);
      return interaction.reply({ content: "❌ Failed to load leaderboard.", ephemeral: true });
    }
  }
};
