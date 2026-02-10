// commands/rank.js
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getUser, nextLevelXP } = require("../database/xp");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("Show your military-themed rank card with avatar"),

  async execute(interaction) {
    try {
      const userId = interaction.user.id;
      const user = getUser(userId);

      const level = Number(user.level);
      const xp = Number(user.xp);
      const prestige = Number(user.prestige);
      const nextXP = nextLevelXP(level);
      const progressPercent = Math.floor((xp / nextXP) * 100);

      const rankNames = [
        "Recruit","Private","Corporal","Sergeant","Lieutenant",
        "Captain","Major","Colonel","General","Field Marshal"
      ];
      const rankIndex = Math.min(Math.floor(level / 5), rankNames.length - 1);
      const rankName = rankNames[rankIndex];

      // Progress bar
      const totalBars = 15;
      const filledBars = Math.floor((xp / nextXP) * totalBars);
      const emptyBars = totalBars - filledBars;
      const barDisplay = "🟩".repeat(filledBars) + "⬜".repeat(emptyBars);

      // Prestige stars
      const prestigeDisplay = prestige ? "✨".repeat(prestige) : "";

      const embed = new EmbedBuilder()
        .setColor("#00ff99")
        .setTitle(`🎖️ ${interaction.user.username}'s Military ID`)
        .setThumbnail(interaction.user.displayAvatarURL({ extension: "png", size: 256 }))
        .setDescription(
          `${rankName} ${prestigeDisplay}\nLevel: **${level}**\nXP: **${xp} / ${nextXP}** (${progressPercent}%)\n${barDisplay}`
        )
        .setFooter({ text: "BattleFront Madness Rank System" });

      await interaction.reply({ embeds: [embed] });

    } catch (err) {
      console.error("❌ Rank command failed:", err);
      await interaction.reply({ content: "❌ Failed to show rank.", ephemeral: true });
    }
  }
};
