const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getUser } = require("../database/xp");
const { getLevelFromXp } = require("../database/levelCurve");
const { getRankName } = require("../xp/ranks");

// Map rank tiers to emojis for flair
const rankEmojis = {
  "Recruit": "🟢",
  "Private": "🔵",
  "Lance Corporal": "🟡",
  "Corporal": "🟠",
  "Sergeant": "🔴",
  "Staff Sergeant": "🟣",
  "Warrant Officer": "⚪",
  "Lieutenant": "🟤",
  "Captain": "🏅",
  "Major": "🎖️",
  "Colonel": "⭐",
  "Brigadier": "🌟",
  "General": "🏆",
  "Field Marshal": "🏅"
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("View your own rank card or another user's rank")
    .addUserOption(option =>
      option.setName("user")
        .setDescription("User to view rank for")
    ),
  async execute(interaction) {
    const target = interaction.options.getUser("user") || interaction.user;
    const userData = getUser(target.id);
    if (!userData) return interaction.reply({ content: "User not found.", ephemeral: true });

    const { level, xp, xpNeeded } = getLevelFromXp(userData.totalXp);
    const rankName = getRankName(level);
    const rankTier = rankName.split(" •")[0];
    const emoji = rankEmojis[rankTier] || "🎖️";

    // Progress bar
    const barLength = 20;
    const progress = Math.floor((xp / xpNeeded) * barLength);
    const bar = "🟩".repeat(progress) + "⬛".repeat(barLength - progress);

    const embed = new EmbedBuilder()
      .setTitle(`${emoji} ${target.username}'s Rank`)
      .setDescription(`**${rankName}**\nPrestige: ${userData.prestige}`)
      .addFields(
        { name: "Level", value: `${level}`, inline: true },
        { name: "XP", value: `${xp.toLocaleString()} / ${xpNeeded.toLocaleString()}`, inline: true },
        { name: "Progress", value: bar }
      )
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setColor(0x00ff00)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};