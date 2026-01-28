const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const { isStaff } = require("../utils/permissions");
const { getAllEvents, saveEvent } = require("../database/events");
const { MOD_LOG_CHANNEL } = require("../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("deleteevent")
    .setDescription("Delete an existing event and all its signups"),

  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: "🚫 Staff only.", ephemeral: true });
    }

    const events = Object.values(getAllEvents())
      .slice(0, 25); // Discord select menu limit

    if (!events.length) {
      return interaction.reply({
        content: "❌ No events available to delete.",
        ephemeral: true
      });
    }

    // ----------------------------
    // Build select menu
    // ----------------------------
    const menu = new StringSelectMenuBuilder()
      .setCustomId("delete_event_select")
      .setPlaceholder("Select an event to delete...")
      .addOptions(
        events.map(ev => ({
          label: ev.name.length > 25 ? ev.name.slice(0, 22) + "..." : ev.name,
          value: ev.id
        }))
      );

    const row = new ActionRowBuilder().addComponents(menu);

    await interaction.reply({
      content: "🗑️ Choose an event to delete:",
      components: [row],
      ephemeral: true
    });
  }
};

// ----------------------------
// SELECT MENU HANDLER (in your index.js)
// ----------------------------
// Make sure you add this to your main bot file:

/*
client.on('interactionCreate', async interaction => {
  if (!interaction.isStringSelectMenu()) return;

  if (interaction.customId === 'delete_event_select') {
    const eventId = interaction.values[0];
    const allEvents = getAllEvents();
    const event = allEvents[eventId];

    if (!event) {
      return interaction.update({ content: "❌ Event not found.", components: [] });
    }

    // Delete event
    delete allEvents[eventId];
    saveEvent(null, allEvents);

    await interaction.update({
      content: `✅ Event "${event.name}" and all its signups have been deleted.`,
      components: []
    });

    // Log to mod channel
    const logCh = interaction.client.channels.cache.get(MOD_LOG_CHANNEL);
    if (logCh) {
      logCh.send(`🗑️ Event "${event.name}" deleted by ${interaction.user.tag}`);
    }
  }
});
*/
