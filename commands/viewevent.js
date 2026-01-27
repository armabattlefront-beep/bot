const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { isStaff } = require("../utils/permissions");
const { getEvent } = require("../database/events");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("viewevent")
    .setDescription("View details and signups of an event")
    .addStringOption(opt =>
      opt.setName("name")
        .setDescription("Event name to view")
        .setRequired(true)
    ),

  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: "🚫 Staff only", ephemeral: true });
    }

    const name = interaction.options.getString("name");
    const event = getEvent(name);
    if (!event) {
      return interaction.reply({ content: `❌ Event "${name}" not found.`, ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle(`📋 Event: ${event.name}`)
      .addFields(
        { name: "Max Spots", value: `${event.maxSpots}`, inline: true },
        { name: "Current Signups", value: `${event.signups.length}`, inline: true },
        { name: "Remaining Spots", value: `${event.maxSpots - event.signups.length}`, inline: true },
        { name: "Participants", value: event.signups.map(s => `<@${s.userId}>`).join("\n") || "None" }
      )
      .setColor(0x00ff99)
      .setTimestamp();

    interaction.reply({ embeds: [embed] });
  }
};
