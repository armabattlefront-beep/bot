const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getUser, getNextLevelXP, getRankName } = require("../database/xp");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("Show your military-themed rank card with avatar"),

  async execute(interaction) {
    try {
      const userId = interaction.user.id;

      // ----------------------------
      // Safe getUser
      // ----------------------------
      let user;
      try {
        user = getUser(userId);
      } catch (err) {
        console.error("❌ Failed to get user data:", err);
        user = { xp: 0, level: 0, prestige: 0 };
      }

      const level = Number(user.level) || 0;
      const xp = Number(user.xp) || 0;
      const nextLevelXP = getNextLevelXP ? getNextLevelXP(level) : 100 + level * 50;
      const progressPercent = Math.floor((xp / nextLevelXP) * 100);

      // ----------------------------
      // Rank display
      // ----------------------------
      let rankName = getRankName ? getRankName(level) : "Recruit";

      const rankEmojis = {
        0: "🟢", 5: "🔰", 10: "🪖", 20: "🎖️",
        30: "⭐", 40: "🛡️", 50: "⚔️", 60: "🎖️", 70: "🏆"
      };

      let rankDisplay = "🟢 Recruit";
      const sortedLevels = Object.keys(rankEmojis).map(Number).sort((a,b)=>a-b);
      for (const lvl of sortedLevels) {
        if (level >= lvl) rankDisplay = `${rankEmojis[lvl]} ${rankName}`;
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
      // Prestige and elite badges
      // ----------------------------
      const prestigeDisplay = user.prestige ? "✨".repeat(user.prestige) : "";
      let eliteBadge = "";
      if (level >= 50) eliteBadge = "🏅";
      if (level >= 70) eliteBadge = "🎖️🏆";

      // ----------------------------
      // Safe avatar URL
      // ----------------------------
      let avatarURL = interaction.user.displayAvatarURL({ extension: "png", size: 256 }) || null;

      // ----------------------------
      // Embed
      // ----------------------------
      const embed = new EmbedBuilder()
        .setColor("#00ff99")
        .setTitle(`🎖️ ${interaction.user.username}'s Military ID`)
        .setDescription(
          `${eliteBadge} ${rankDisplay} ${prestigeDisplay}\n\n` +
          `Level: **${level}** ${eliteBadge}\n` +
          `XP: **${xp} / ${nextLevelXP}** (${progressPercent}%)\n\n` +
          `${barDisplay}`
        )
        .setFooter({ text: "BattleFront Madness Rank System" });

      if (avatarURL) embed.setThumbnail(avatarURL);

      await interaction.reply({ embeds: [embed] });

    } catch (err) {
      console.error("❌ Rank command failed:", err);
      await interaction.reply({
        content: "❌ Failed to show rank. Check console for errors.",
        ephemeral: true
      });
    }
  }
};
