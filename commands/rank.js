const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const db = require("../database/db");
const { nextLevelXP } = require("../database/xp");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("Show your military-themed rank card with avatar"),

  async execute(interaction) {
    try {
      const userId = interaction.user.id;

      // Fetch user directly from DB, fallback to zeros
      const user = db.prepare("SELECT * FROM users WHERE userId = ?").get(userId) || { xp: 0, level: 0, prestige: 0 };

      const level = Number(user.level) || 0;
      const xp = Number(user.xp) || 0;
      const nextXP = nextLevelXP(level);
      const progressPercent = Math.floor((xp / nextXP) * 100);

      // Military-style rank names
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
      const prestigeDisplay = user.prestige ? "✨".repeat(user.prestige) : "";

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
