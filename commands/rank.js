const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getUser, getNextLevelXP, getRankName } = require("../database/xp");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("Show your military-themed rank card with avatar"),

  async execute(interaction) {
    try {
      const userId = interaction.user.id;
      const user = getUser(userId) || { xp: 0, level: 0, prestige: 0 };

      const level = user.level;
      const xp = user.xp;
      const nextLevelXP = getNextLevelXP(level);
      const progressPercent = Math.floor((xp / nextLevelXP) * 100);

      // ----------------------------
      // Rank display with military flair
      // ----------------------------
      const rankEmojis = {
        0: "🟢",   5: "🔰",  10: "🪖",  20: "🎖️",
        30: "⭐",  40: "🛡️",  50: "⚔️",  60: "🎖️",
        70: "🏆"
      };

      let rankDisplay = "🟢 Recruit";
      const sortedLevels = Object.keys(rankEmojis).map(Number).sort((a,b)=>a-b);
      for (const lvl of sortedLevels) {
        if (level >= lvl) rankDisplay = `${rankEmojis[lvl]} ${getRankName(level)}`;
      }

      // ----------------------------
      // Progress bar
      // ----------------------------
      const totalBars = 15;
      const filledBars = Math.floor((xp / nextLevelXP) * totalBars);
      const emptyBars = totalBars - filledBars;

      let barDisplay = "";
      for (let i = 0; i < filledBars; i++) {
        if (i < filledBars * 0.3) barDisplay += "🟩";
        else if (i < filledBars * 0.6) barDisplay += "🟨";
        else barDisplay += "🟧";
      }
      barDisplay += "⬜".repeat(emptyBars);

      // ----------------------------
      // Prestige & elite badges
      // ----------------------------
      const prestigeDisplay = user.prestige ? "✨".repeat(user.prestige) : "";
      let eliteBadge = "";
      if (level >= 50) eliteBadge = "🏅";
      if (level >= 70) eliteBadge = "🎖️🏆";

      // ----------------------------
      // Embed with avatar
      // ----------------------------
      const embed = new EmbedBuilder()
        .setColor("#00ff99")
        .setTitle(`🎖️ ${interaction.user.username}'s Military ID`)
        .setThumbnail(interaction.user.displayAvatarURL({ extension: "png", size: 256 })) // avatar on right
        .setDescription(
          `${eliteBadge} ${rankDisplay} ${prestigeDisplay}\n\n` +
          `Level: **${level}** ${eliteBadge}\n` +
          `XP: **${xp} / ${nextLevelXP}** (${progressPercent}%)\n\n` +
          `${barDisplay}`
        )
        .setFooter({ text: "BattleFront Madness Rank System" });

      await interaction.reply({ embeds: [embed] });

    } catch (err) {
      console.error("❌ Rank command error:", err);
      await interaction.reply({ content: "❌ Failed to show rank.", ephemeral: true });
    }
  }
};
