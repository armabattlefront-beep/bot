const {
  SlashCommandBuilder,
  EmbedBuilder
} = require("discord.js");
const { getAllEvents } = require("../database/events");
const { buildEventMenu } = require("../utils/paginatedMenu");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("viewevent")
    .setDescription("Select an event to view its details"),

  async execute(interaction) {
    const events = Object.values(getAllEvents())
      .filter(ev => ev.timestamp > Date.now());

    if (!events.length) {
      return interaction.reply({
        content: "❌ No open events available.",
        ephemeral: true
      });
    }

    const { rows } = buildEventMenu(events, 0, "view_event");

    await interaction.reply({
      content: "🗂️ Select an event to view:",
      components: rows,
      ephemeral: true
    });
  }
};
