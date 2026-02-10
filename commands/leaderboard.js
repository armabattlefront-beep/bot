const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getUser, nextLevelXP } = require("../database/xp"); // adjust path if needed

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

      // Fetch all guild members
      const members = await interaction.guild.members.fetch();

      // Map each member to XP/level (default 0 if missing)
      const leaderboard = members.map(member => {
        const user = getUser(member.id) || { xp: 0, level: 0 };
        return { userId: member.id, xp: user.xp, level: user.level };
      });

      // Sort by level then XP
      leaderboard.sort((a, b) => b.level - a.level || b.xp - a.xp);

      // Slice top N
      const topUsers = leaderboard.slice(0, topCount);

      // Military-style rank names
      const rankNames = [
        "Recruit","Private","Corporal","Sergeant","Lieutenant",
        "Captain","Major","Colonel","General","Field Marshal"
      ];

      const description = topUsers.map((user, i) => {
        const rankName = rankNames[Math.min(Math.floor(user.level / 5), rankNames.length - 1)];
        const nextXP = nextLevelXP(user.level);
        return `**${i + 1}. <@${user.userId}>** — ${rankName} | Level ${user.level} | ⭐ ${user.xp} / ${nextXP} XP`;
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
