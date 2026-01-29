const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder
} = require("discord.js");
const { getEvent, saveEvent, getAllEvents } = require("../database/events");
const { isStaff } = require("../utils/permissions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("assignstatus")
    .setDescription("Assign player status for an event"),

  async execute(interaction) {
    if (!isStaff(interaction.member))
      return interaction.reply({ content: "🚫 Staff only.", ephemeral: true });

    const events = Object.values(getAllEvents()).slice(0, 25);

    const menu = new StringSelectMenuBuilder()
      .setCustomId("assignstatus_event")
      .setPlaceholder("Select event")
      .addOptions(events.map(ev => ({
        label: ev.name,
        value: ev.id
      })));

    interaction.reply({
      content: "Select an event:",
      components: [new ActionRowBuilder().addComponents(menu)],
      ephemeral: true
    });
  }
};
