const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const { getEvent, getAllEvents } = require("../database/events");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("viewevent")
    .setDescription("Select an event to view its details"),

  async execute(interaction) {
    const events = Object.values(getAllEvents())
      .filter(ev => ev.timestamp > Date.now()) // only future/open events
      .slice(0, 25); // Discord select menu limit

    if (!events.length) {
      return interaction.reply({
        content: "❌ No open events available.",
        ephemeral: true
      });
    }

    // ----------------------------
    // Build select menu
    // ----------------------------
    const menu = new StringSelectMenuBuilder()
      .setCustomId("view_event_select")
      .setPlaceholder("Choose an event...")
      .addOptions(
        events.map(ev => ({
          label: ev.name.length > 25 ? ev.name.slice(0, 22) + "..." : ev.name,
          value: ev.id
        }))
      );

    const row = new ActionRowBuilder().addComponents(menu);

    await interaction.reply({
      content: "🗂️ Select an event to view:",
      components: [row],
      ephemeral: true
    });
  }
};

// ----------------------------
// INTERACTION HANDLER (in your index.js)
// ----------------------------
// You need to handle select menu interactions somewhere in your main bot file:

/*
client.on('interactionCreate', async interaction => {
  if (!interaction.isStringSelectMenu()) return;

  if (interaction.customId === 'view_event_select') {
    const eventId = interaction.values[0];
    const event = getEvent(eventId);
    if (!event) return interaction.update({ content: "❌ Event not found.", components: [] });

    const embed = new EmbedBuilder()
      .setTitle(`🗂️ Event: ${event.name}`)
      .setDescription(event.description || "No description provided.")
      .addFields(
        { name: "Max Players", value: `${event.maxPlayers}`, inline: true },
        { name: "Group Size", value: event.groupSize ? `${event.groupSize}` : "N/A", inline: true },
        { name: "Current Participants", value: event.signups.length.toString(), inline: true },
        { name: "Date", value: event.date || "N/A", inline: true },
        { name: "Time", value: event.time || "N/A", inline: true }
      )
      .setColor(0x1abc9c)
      .setTimestamp();

    // Group participants by squad
    if (event.signups.length > 0) {
      const grouped = {};
      for (const p of event.signups) {
        const group = p.group || "Unassigned";
        if (!grouped[group]) grouped[group] = [];
        grouped[group].push(`<@${p.id}>`);
      }
      for (const [group, members] of Object.entries(grouped)) {
        embed.addFields({
          name: `Squad ${group}`,
          value: members.join("\n"),
          inline: true
        });
      }
    }

    await interaction.update({ embeds: [embed], components: [] });
  }
});
*/
