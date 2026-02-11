const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { toggleDoubleXP, isDoubleXPActive } = require("../database/xpEngine");
const config = require("../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("doublexp")
    .setDescription("Staff: Toggle double XP for all users"),

  async execute(interaction) {
    if (!interaction.member.roles.cache.some(r => Object.values(config.STAFF_ROLE_IDS).includes(r.id))) {
      return interaction.reply({ content: "❌ You do not have permission to toggle double XP.", ephemeral: true });
    }

    const active = await isDoubleXPActive();
    await toggleDoubleXP(!active);

    const embed = new EmbedBuilder()
      .setTitle("🔥 Double XP Status Changed")
      .setDescription(`Double XP is now **${!active ? "ACTIVE" : "INACTIVE"}**!`)
      .setColor(!active ? 0xe74c3c : 0x95a5a6)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
