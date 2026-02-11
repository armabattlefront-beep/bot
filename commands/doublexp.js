const { SlashCommandBuilder } = require("discord.js");
const { toggleDoubleXP, isDoubleXPActive } = require("../database/xpEngine");
const config = require("../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("doublexp")
    .setDescription("Staff: Toggle double XP weekend on/off"),

  async execute(interaction) {
    if (!interaction.member.roles.cache.some(r => Object.values(config.STAFF_ROLE_IDS).includes(r.id)))
      return interaction.reply({ content: "❌ You do not have permission.", ephemeral: true });

    const active = isDoubleXPActive();
    toggleDoubleXP();

    await interaction.reply({ content: `⚡ Double XP is now **${active ? "OFF" : "ON"}**!` });
  }
};
