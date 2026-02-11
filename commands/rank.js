const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const {
  getUserXPData,
  getUserLevel,
  getUserPrestige,
  getRankCard
} = require("../database/xpEngine");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("Check your BattleFront rank or another member's rank")
    .addUserOption(option =>
      option.setName("target")
        .setDescription("The user to check")
        .setRequired(false)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser("target") || interaction.user;

    // Get all XP-related data
    const xpData = await getUserXPData(user.id); // returns { xp, level, prestige, nextLevelXP }
    const level = xpData.level;
    const prestige = xpData.prestige;
    const xp = xpData.xp;
    const xpToNext = xpData.nextLevelXP - xp;

    // Build embed
    const embed = new EmbedBuilder()
      .setTitle(`🎖️ BattleFront Rank Card: ${user.tag}`)
      .setColor(0x1abc9c)
      .addFields(
        { name: "Level", value: `${level}`, inline: true },
        { name: "Prestige", value: `${prestige}`, inline: true },
        { name: "XP", value: `${xp} XP`, inline: true },
        { name: "XP to Next Level", value: `${xpToNext} XP`, inline: true }
      )
      .setFooter({ text: "Earn XP by chatting, reacting, playing, and more!" })
      .setTimestamp();

    // Attach dynamic rank card image
    const cardURL = await getRankCard(user.id);
    if (cardURL) embed.setImage(cardURL);

    await interaction.reply({ embeds: [embed], ephemeral: false });
  }
};
