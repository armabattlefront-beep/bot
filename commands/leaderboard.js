// commands/leaderboard.js
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getLeaderboard, nextLevelXP } = require("../database/xp");

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

      const rows = getLeaderboard(topCount);
      if (!rows.length) {
        return interaction.reply({ content: "❌ No users found in the database.", ephemeral: true });
      }

      const rankNames = [
        "Recruit","Private","Corporal","Sergeant","Lieutenant",
        "Captain","Major","Colonel","General","Field Marshal"
      ];

      const description = rows.map((user, i) => {
        const rankIndex = Math.min(Math.floor(user.level / 5), rankNames.length - 1);
        const rankName = rankNames[rankIndex];
        const nextXP = nextLevelXP(user.level);
        const prestigeDisplay = user.prestige ? "✨".repeat(user.prestige) : "";
        return `**${i + 1}. <@${user.userId}>** — ${rankName} ${prestigeDisplay} | Level ${user.level} | ⭐ ${user.xp} / ${nextXP} XP`;
      }).join("\n");

      const embed = new EmbedBuilder()
        .setTitle("🎖️ BattleFront Leaderboard")
        .setDescription(description)
        .setColor(0x00ff00)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } catch (err) {
      console.error("❌ Leaderboard command failed:", err);
      await interaction.reply({ content: "❌ Failed to load leaderboard.", ephemeral: true });
    }
  }
};
