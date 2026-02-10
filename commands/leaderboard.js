const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const db = require("../database/db");
const { nextLevelXP } = require("../database/xp");

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

      // Fetch all users from database
      const users = db.prepare("SELECT * FROM users").all();

      // Sort by level DESC, xp DESC
      users.sort((a, b) => b.level - a.level || b.xp - a.xp);

      // Slice top N
      const topUsers = users.slice(0, topCount);

      // Military-style rank names
      const rankNames = [
        "Recruit","Private","Corporal","Sergeant","Lieutenant",
        "Captain","Major","Colonel","General","Field Marshal"
      ];

      const description = await Promise.all(topUsers.map(async (user, i) => {
        const rankName = rankNames[Math.min(Math.floor(user.level / 5), rankNames.length - 1)];
        const nextXP = nextLevelXP(user.level);
        return `**${i + 1}. <@${user.userId}>** — ${rankName} | Level ${user.level} | ⭐ ${user.xp} / ${nextXP} XP`;
      }));

      const embed = new EmbedBuilder()
        .setTitle("🎖️ BattleFront Leaderboard")
        .setDescription(description.join("\n"))
        .setColor(0x00ff00)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } catch (err) {
      console.error("❌ Leaderboard command failed:", err);
      await interaction.reply({ content: "❌ Failed to load leaderboard.", ephemeral: true });
    }
  }
};
