const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { isStaff } = require("../utils/permissions");
const { getEventApplications } = require("../database/apps");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("viewevent")
    .setDescription("View participants, status, and groups for an event")
    .addStringOption(opt =>
      opt.setName("event")
        .setDescription("Select the event")
        .setRequired(true)
    ),

  async execute(interaction) {
    if (!isStaff(interaction.member)) 
      return interaction.reply({ content: "🚫 Staff only.", ephemeral: true });

    const eventId = interaction.options.getString("event");
    const participants = getEventApplications(eventId);

    if (!participants || participants.length === 0) {
      return interaction.reply({ content: "⚠️ No participants found for this event.", ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle(`📋 Event: ${eventId}`)
      .setColor(0x1abc9c)
      .setTimestamp();

    participants.forEach(p => {
      embed.addFields({
        name: `<@${p.userId}>`,
        value: `Status: ${p.status || "pending"} | Group: ${p.group || "Unassigned"}`,
        inline: false
      });
    });

    interaction.reply({ embeds: [embed] });
  }
};
