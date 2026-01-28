const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getUser, addXP, setLevel } = require("../database/xp"); // only what exists

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("Show your military-themed rank card with avatar"),

  async execute(interaction) {
    try {
      const userId = interaction.user.id;
      const user = getUser(userId) || { xp: 0, level: 0, prestige: 0 };

      const level = Number(user.level) || 0;
      const xp = Number(user.xp) || 0;
      const nextLevelXP = 100 + level * 50; // ✅ calculate directly
      const progressPercent = Math.floor((xp / nextLevelXP) * 100);

      // ----------------------------
      // Rank display
      // ----------------------------
      const rankNames = [
        "Recruit", "Private", "Corporal", "Sergeant", "Lieutenant",
        "Captain", "Major", "Colonel", "General"
      ];

      // Simple rank calculation
      let rankName = rankNames[Math.min(Math.floor(level / 5), rankNames.length - 1)];

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
        .setThumbnail(interaction.user.displayAvatarURL({ extension: "png", size: 256 }))
        .setDescription(
          `${eliteBadge} ${rankDisplay} ${prestigeDisplay}\n\n` +
          `Level: **${level}** ${eliteBadge}\n` +
          `XP: **${xp} / ${nextLevelXP}** (${progressPercent}%)\n\n` +
          `${barDisplay}`
        )
        .setFooter({ text: "BattleFront Madness Rank System" });

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
