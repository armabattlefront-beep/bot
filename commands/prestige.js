// commands/prestige.js
const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");
const { getUserData, prestigeUser } = require("../database/xpEngine");
const config = require("../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("prestige")
    .setDescription("Check your prestige status or prestige if you reached max level")
    .addUserOption(option =>
      option
        .setName("target")
        .setDescription("Check another user's prestige info")
        .setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser("target") || interaction.user;
    const userData = await getUserData(target.id);

    if (!userData) {
      return interaction.reply({ content: "❌ User data not found.", ephemeral: true });
    }

    const maxLevel = 200; // your max level
    const canPrestige = userData.level >= maxLevel;
    const prestigeText = userData.prestige > 0 ? `Prestige ${userData.prestige}` : "No prestige";

    const embed = new EmbedBuilder()
      .setTitle(`🎖 ${target.username}'s Prestige Info`)
      .setColor(0x3498db)
      .addFields(
        { name: "Level", value: `${userData.level}`, inline: true },
        { name: "Prestige", value: prestigeText, inline: true },
        { name: "XP", value: `${userData.xp} / ${userData.nextLevelXP}`, inline: true },
      )
      .setTimestamp();

    const row = new ActionRowBuilder();

    if (target.id === interaction.user.id && canPrestige) {
      const prestigeButton = new ButtonBuilder()
        .setCustomId("prestige_confirm")
        .setLabel("Prestige Now")
        .setStyle(ButtonStyle.Primary);

      row.addComponents(prestigeButton);
    }

    await interaction.reply({
      embeds: [embed],
      components: row.components.length ? [row] : [],
      ephemeral: true
    });
  },

  // =======================
  // Handle Button Clicks
  // =======================
  async handleButton(interaction, client) {
    if (interaction.customId !== "prestige_confirm") return;

    const userData = await getUserData(interaction.user.id);
    if (!userData) return interaction.reply({ content: "❌ User data not found.", ephemeral: true });

    const maxLevel = 200;
    if (userData.level < maxLevel) {
      return interaction.reply({ content: "❌ You must be at max level to prestige.", ephemeral: true });
    }

    const newPrestige = await prestigeUser(interaction.user.id); // resets level and xp, increments prestige
    await interaction.update({
      content: `✅ Congratulations! You have prestiged to Prestige ${newPrestige}!`,
      embeds: [],
      components: []
    });
  }
};
