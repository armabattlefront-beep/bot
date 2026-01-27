const { SlashCommandBuilder } = require("discord.js");
const { isStaff } = require("../utils/permissions");
const { deleteEvent, getAllEvents } = require("../database/events");
const { MOD_LOG_CHANNEL } = require("../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("deleteevent")
    .setDescription("Delete an existing event and all its signups")
    .addStringOption(opt =>
      opt
        .setName("event")
        .setDescription("Select the event to delete")
        .setRequired(true)
        // Populate choices dynamically from current events
        .addChoices(...getAllEvents().map(ev => ({
          name: ev.name,
          value: ev.name.toLowerCase().replace(/\s+/g, "_")
        })))
    ),

  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: "🚫 Staff only.", ephemeral: true });
    }

    const eventId = interaction.options.getString("event");

    const success = deleteEvent(eventId);

    if (!success) {
      return interaction.reply({ content: `❌ Event "${eventId}" not found or could not be deleted.`, ephemeral: true });
    }

    interaction.reply({ content: `✅ Event "${eventId}" and all its signups have been deleted.` });

    // Log to mod channel
    const logCh = interaction.client.channels.cache.get(MOD_LOG_CHANNEL);
    if (logCh) {
      logCh.send(`🗑️ Event "${eventId}" deleted by ${interaction.user.tag}`);
    }
  }
};
