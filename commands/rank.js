const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getUserXP, getUserLevel, getPrestige, getRankCard } = require("../database/xpEngine");

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

    const xpData = getUserXP(user.id);
    const level = getUserLevel(user.id);
    const prestige = getPrestige(user.id);

    const embed = new EmbedBuilder()
      .setTitle(`🎖️ BattleFront Rank Card: ${user.tag}`)
      .setColor(0x1abc9c)
      .addFields(
        { name: "Level", value: `${level}`, inline: true },
        { name: "Prestige", value: `${prestige}`, inline: true },
        { name: "XP", value: `${xpData} XP`, inline: true }
      )
      .setFooter({ text: "Earn XP by chatting, reacting, playing, and more!" })
      .setTimestamp();

    // Optional: attach a generated rank card image
    const cardURL = getRankCard(user.id);
    if (cardURL) embed.setImage(cardURL);

    await interaction.reply({ embeds: [embed], ephemeral: false });
  }
};
