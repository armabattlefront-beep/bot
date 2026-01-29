const {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder
} = require("discord.js");
const { getAllEvents } = require("../database/events");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("editevent")
    .setDescription("Select event to edit"),

  async execute(interaction) {
    const events = Object.values(getAllEvents());

    const menu = new StringSelectMenuBuilder()
      .setCustomId("edit_event_select")
      .setPlaceholder("Select event")
      .addOptions(events.map(ev => ({
        label: ev.name,
        value: ev.id
      })));

    interaction.reply({
      content: "Select an event to edit:",
      components: [new ActionRowBuilder().addComponents(menu)],
      ephemeral: true
    });
  }
};
