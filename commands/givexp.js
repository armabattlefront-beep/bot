const { SlashCommandBuilder } = require("discord.js");
const { addXP } = require("../database/xpEngine");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("givexp")
    .setDescription("Gift XP to another user")
    .addUserOption(option =>
      option.setName("target")
        .setDescription("The user to gift XP to")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName("amount")
        .setDescription("Amount of XP to gift")
        .setRequired(true)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser("target");
    let amount = interaction.options.getInteger("amount");

    if (target.id === interaction.user.id)
      return interaction.reply({ content: "❌ You cannot gift XP to yourself.", ephemeral: true });

    if (amount <= 0) return interaction.reply({ content: "❌ XP amount must be positive.", ephemeral: true });

    addXP(target.id, amount);
    await interaction.reply({ content: `✅ You gifted **${amount} XP** to <@${target.id}>!` });
  }
};
