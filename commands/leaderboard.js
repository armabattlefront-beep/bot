const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getLeaderboard } = require("../database/xp");

// =======================
// RANK NAMES
// =======================
function getRankName(level) {
  if (level < 5) return "Recruit";
  if (level < 10) return "Private";
  if (level < 20) return "Corporal";
  if (level < 30) return "Sergeant";
  if (level < 40) return "Lieutenant";
  if (level < 50) return "Captain";
  if (level < 70) return "Major";
  if (level < 90) return "Colonel";
  return "General";
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Show the top BattleFront ranks")
    .addIntegerOption(opt =>
      opt
        .setName("top")
        .setDescription("How many users to show (default 10)")
        .setMinValue(1)
        .setMaxValue(25)
    ),

  async execute(interaction) {
    try {
      const top = interaction.options.getInteger("top") || 10;
      const users = getLeaderboard(top);

      if (!users.length) {
        return interaction.reply({
          content: "No XP data found yet.",
          ephemeral: true
        });
      }

      const description = users
        .map((u, i) =>
          `**${i + 1}. <@${u.userId}>** — ${getRankName(u.level)} | Level **${u.level}** | ⭐ **${u.xp} XP**`
        )
        .join("\n");

      const embed = new EmbedBuilder()
        .setTitle("🎖️ BattleFront Leaderboard")
        .setColor(0x00ff00)
        .setDescription(description)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      console.error("❌ Leaderboard error:", err);
      await interaction.reply({
        content: "❌ Failed to load leaderboard.",
        ephemeral: true
      });
    }
  }
};
