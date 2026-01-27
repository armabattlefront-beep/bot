const { SlashCommandBuilder } = require("discord.js");
const { isStaff } = require("../utils/permissions");
const { assignGroups } = require("../database/apps");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("assigngroups")
    .setDescription("Automatically assign all participants into groups of 6")
    .addStringOption(opt =>
      opt.setName("event")
        .setDescription("Select the event")
        .setRequired(true)
    ),

  async execute(interaction) {
    if (!isStaff(interaction.member)) 
      return interaction.reply({ content: "🚫 Staff only.", ephemeral: true });

    const eventId = interaction.options.getString("event");
    const success = assignGroups(eventId);

    if (!success) {
      return interaction.reply({ content: "❌ Failed to assign groups. Check the event ID.", ephemeral: true });
    }

    interaction.reply({ content: `✅ All participants for **${eventId}** have been assigned into groups of 6.` });
  }
};
