const { SlashCommandBuilder } = require("discord.js");
const { isStaff } = require("../utils/permissions");
const { getAllEvents, saveEvent } = require("../database/events");
const { MOD_LOG_CHANNEL } = require("../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("deleteevent")
    .setDescription("Delete an existing event and all its signups")
    .addStringOption(opt =>
      opt.setName("event")
        .setDescription("Select the event to delete")
        .setRequired(true)
        .setAutocomplete(true)
    ),

  // ----------------------------
  // AUTOCOMPLETE FOR EVENTS
  // ----------------------------
  async autocomplete(interaction) {
    const focused = interaction.options.getFocused();
    const events = Object.values(getAllEvents());
    const filtered = events
      .map(ev => ev.name)
      .filter(name => name.toLowerCase().includes(focused.toLowerCase()));
    
    await interaction.respond(
      filtered.slice(0, 25).map(name => ({ name, value: name })) // max 25
    );
  },

  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: "🚫 Staff only.", ephemeral: true });
    }

    const eventName = interaction.options.getString("event");
    const eventId = eventName.toLowerCase().replace(/\s+/g, "_");
    const allEvents = getAllEvents();

    if (!allEvents[eventId]) {
      return interaction.reply({ content: `❌ Event "${eventName}" not found.`, ephemeral: true });
    }

    // Delete event
    delete allEvents[eventId];
    saveEvent(null, allEvents); // Save the updated events object

    await interaction.reply({ content: `✅ Event "${eventName}" and all its signups have been deleted.` });

    // Log to mod channel
    const logCh = interaction.client.channels.cache.get(MOD_LOG_CHANNEL);
    if (logCh) {
      logCh.send(`🗑️ Event "${eventName}" deleted by ${interaction.user.tag}`);
    }
  }
};
