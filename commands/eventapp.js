const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const { getAllEvents, getEvent, saveEvent } = require("../database/events");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("eventapp")
    .setDescription("Apply for a BattleFront event"),

  async execute(interaction) {
    const events = getAllEvents(); // Get all events for dropdown
    if (!events || events.length === 0) {
      return interaction.reply({ content: "❌ There are currently no open events.", ephemeral: true });
    }

    const options = events.map(ev => ({
      label: ev.name,
      description: ev.description?.slice(0, 100) || "No description",
      value: ev.id.toString()
    }));

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("apply_event_select")
      .setPlaceholder("Select an event to apply for")
      .addOptions(options);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.reply({
      content: "Please select an event to apply for:",
      components: [row],
      ephemeral: true
    });
  }
};
