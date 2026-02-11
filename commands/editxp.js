const { SlashCommandBuilder } = require("discord.js");
const { setXP } = require("../database/xpEngine");
const config = require("../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("editxp")
    .setDescription("Staff: Set a user's XP to a specific amount")
    .addUserOption(option =>
      option.setName("target")
        .setDescription("The user to edit")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName("amount")
        .setDescription("XP amount")
        .setRequired(true)
    ),

  async execute(interaction) {
    if (!interaction.member.roles.cache.some(r => Object.values(config.STAFF_ROLE_IDS).includes(r.id)))
      return interaction.reply({ content: "❌ You do not have permission.", ephemeral: true });

    const target = interaction.options.getUser("target");
    const amount = interaction.options.getInteger("amount");

    if (amount < 0) return interaction.reply({ content: "❌ XP cannot be negative.", ephemeral: true });

    setXP(target.id, amount);
    await interaction.reply({ content: `✅ Set <@${target.id}>'s XP to **${amount}**.` });
  }
};
