const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { setUserXPData, getUserXPData } = require("../database/xpEngine");
const config = require("../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("editxp")
    .setDescription("Staff: Edit a user's XP or level directly")
    .addUserOption(option =>
      option.setName("target")
        .setDescription("User to edit")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName("xp")
        .setDescription("Set XP amount")
        .setRequired(false)
    )
    .addIntegerOption(option =>
      option.setName("level")
        .setDescription("Set level")
        .setRequired(false)
    ),

  async execute(interaction) {
    // Staff check
    if (!interaction.member.roles.cache.some(r => Object.values(config.STAFF_ROLE_IDS).includes(r.id))) {
      return interaction.reply({ content: "❌ You do not have permission to edit XP.", ephemeral: true });
    }

    const user = interaction.options.getUser("target");
    const xp = interaction.options.getInteger("xp");
    const level = interaction.options.getInteger("level");

    await setUserXPData(user.id, { xp, level });

    const xpData = await getUserXPData(user.id);

    const embed = new EmbedBuilder()
      .setTitle(`⚙️ XP Edited`)
      .setDescription(`Updated XP for <@${user.id}>`)
      .addFields(
        { name: "Level", value: `${xpData.level}`, inline: true },
        { name: "XP", value: `${xpData.xp}`, inline: true },
        { name: "Prestige", value: `${xpData.prestige}`, inline: true }
      )
      .setColor(0xe67e22)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
