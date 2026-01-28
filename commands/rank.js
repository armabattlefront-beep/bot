const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getUser, getNextLevelXP, getRankName } = require("../database/xp");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("Show your current rank, level, and XP"),

  async execute(interaction) {
    try {
      const userId = interaction.user.id;
      const user = getUser(userId) || { xp: 0, level: 0 };

      const level = user.level || 0;
      const xp = user.xp || 0;
      const nextLevelXP = getNextLevelXP(level);
      const progressPercent = Math.floor((xp / nextLevelXP) * 100);

      // Military-themed rank emojis
      const rankEmojiMap = {
        0: "🟢 Recruit",
        5: "🔰 Private",
        10: "🪖 Corporal",
        20: "🎖️ Sergeant",
        30: "⭐ Lieutenant",
        40: "🛡️ Captain",
        50: "⚔️ Major",
        60: "🎖️ Colonel",
        70: "🏆 General"
      };

      // Find closest rank emoji
      let rankDisplay = "🟢 Recruit";
      for (const lvl of Object.keys(rankEmojiMap).map(Number).sort((a,b)=>a-b)) {
        if (level >= lvl) rankDisplay = rankEmojiMap[lvl];
      }

      // Progress bar using emojis
      const totalBars = 10;
      const filledBars = Math.floor((xp / nextLevelXP) * totalBars);
      const emptyBars = totalBars - filledBars;
      const barDisplay = "🟩".repeat(filledBars) + "⬜".repeat(emptyBars);

      const embed = new EmbedBuilder()
        .setColor("#00ff99")
        .setTitle(`🎖️ ${interaction.user.username}'s Military Rank`)
        .setDescription(
          `${rankDisplay}\n\n` +
          `Level: **${level}**\n` +
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
