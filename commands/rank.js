const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getUserXP } = require("../database/xpEngine");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("Check your level and XP or another user")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("Select a user to check their rank")
    ),

  async execute(interaction) {
    const target = interaction.options.getUser("user") || interaction.user;
    const data = getUserXP(target.id);

    const embed = new EmbedBuilder()
      .setTitle(`📊 Rank for ${target.username}`)
      .setColor(0x1abc9c)
      .addFields(
        { name: "Level", value: `${data.level}`, inline: true },
        { name: "XP", value: `${data.xp}`, inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: false });
  },
};