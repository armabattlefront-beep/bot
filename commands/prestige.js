const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getUserXPData, canPrestige, doPrestige } = require("../database/xpEngine");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("prestige")
    .setDescription("Prestige your account once you reach max level"),

  async execute(interaction) {
    const userId = interaction.user.id;
    const xpData = await getUserXPData(userId);

    if (!canPrestige(xpData)) {
      return interaction.reply({
        content: "❌ You must reach the max level before you can prestige.",
        ephemeral: true
      });
    }

    await doPrestige(userId);

    const updatedData = await getUserXPData(userId);

    const embed = new EmbedBuilder()
      .setTitle("🎖️ Prestige Achieved!")
      .setDescription(`<@${userId}> has prestiged to **Prestige ${updatedData.prestige}**!`)
      .addFields(
        { name: "Level Reset To", value: `${updatedData.level}`, inline: true },
        { name: "Current XP", value: `${updatedData.xp}`, inline: true }
      )
      .setColor(0x9b59b6)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
