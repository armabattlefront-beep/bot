const { SlashCommandBuilder } = require("discord.js");
const { isStaff } = require("../utils/permissions");
const { getAllEvents, saveEvent } = require("../database/events");
const { MOD_LOG_CHANNEL } = require("../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("deleteevent")
    .setDescription("Delete an existing event and all its signups")
    .addStringOption(opt => {
      const allEvents = getAllEvents();
      const choices = Object.values(allEvents).map(e => ({
        name: `${e.name} (${e.id})`,
        value: e.id
      }));

      return opt
        .setName("event")
        .setDescription("Select the event to delete")
        .setRequired(true)
        .addChoices(...choices);
    }),

  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: "🚫 Staff only.", ephemeral: true });
    }

    const eventId = interaction.options.getString("event");
    const allEvents = getAllEvents();

    if (!allEvents[eventId]) {
      return interaction.reply({ content: `❌ Event "${eventId}" not found.`, ephemeral: true });
    }

    // Delete event
    delete allEvents[eventId];
    saveEvent(null, allEvents); // Save entire updated events object

    interaction.reply({ content: `✅ Event "${eventId}" and all its signups have been deleted.` });

    // Log to mod channel
    const logCh = interaction.client.channels.cache.get(MOD_LOG_CHANNEL);
    if (logCh) logCh.send(`🗑️ Event "${eventId}" deleted by ${interaction.user.tag}`);
  }
};
