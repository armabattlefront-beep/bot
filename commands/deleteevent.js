const { SlashCommandBuilder } = require("discord.js");
const { isStaff } = require("../utils/permissions");
const { getEvent, deleteEvent } = require("../database/events");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("deleteevent")
    .setDescription("Delete an existing BattleFront event")
    .addStringOption(opt =>
      opt.setName("name")
        .setDescription("Name of the event to delete")
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

    const deleted = deleteEvent(name);
    if (!deleted) {
      return interaction.reply({ content: `❌ Failed to delete "${name}".`, ephemeral: true });
    }

    interaction.reply({ content: `✅ Event "${name}" deleted successfully.` });
  }
};
