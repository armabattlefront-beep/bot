const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const { getAllEvents } = require("../database/events");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("viewevent")
    .setDescription("Select an event to view its details"),

  async execute(interaction) {
    // Convert events object to array & filter future events
    const events = Object.values(getAllEvents() || []).filter(ev => ev.timestamp > Date.now());

    if (!events.length) {
      return interaction.reply({
        content: "❌ No open events available.",
        ephemeral: true
      });
    }

    // Create dropdown options
    const options = events.map(ev => ({
      label: ev.name,
      description: ev.description?.slice(0, 100) || "No description",
      value: ev.id.toString()
    }));

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("view_event_select")
      .setPlaceholder("Select an event to view details")
      .addOptions(options);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.reply({
      content: "🗂️ Select an event to view:",
      components: [row],
      ephemeral: true
    });
  }
};
