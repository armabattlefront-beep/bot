const { SlashCommandBuilder } = require("discord.js");
const { giftXP } = require("../database/xp");

module.exports = {

  data: new SlashCommandBuilder()
    .setName("giftxp")
    .setDescription("Gift XP to another user")
    .addUserOption(o =>
      o.setName("user")
      .setDescription("Target user")
      .setRequired(true))
    .addIntegerOption(o =>
      o.setName("amount")
      .setDescription("XP amount")
      .setRequired(true)),

  async execute(interaction) {

    const target = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");

    const result = giftXP(
      interaction.user.id,
      target.id,
      amount
    );

    if (result.error) {
      return interaction.reply({
        content: result.error,
        ephemeral:true
      });
    }

    interaction.reply(
      `🎁 ${interaction.user.username} gifted **${amount} XP** to ${target.username}`
    );

  }

};