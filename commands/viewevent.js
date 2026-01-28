const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getEvent, getAllEvents } = require("../database/events");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("viewevent")
    .setDescription("View details of an open event")
    .addStringOption(opt =>
      opt.setName("event")
         .setDescription("Select an event")
         .setRequired(true)
         .setAutocomplete(true)
    ),

  // ----------------------------
  // AUTOCOMPLETE HANDLER
  // ----------------------------
  async autocomplete(interaction) {
    const focused = interaction.options.getFocused();
    const events = Object.values(getAllEvents());

    // Filter only open events (not full / not past)
    const openEvents = events.filter(ev => {
      const now = Date.now();
      return ev.timestamp > now; // event still in future
    });

    const filtered = openEvents
      .map(ev => ev.name)
      .filter(name => name.toLowerCase().includes(focused.toLowerCase()))
      .slice(0, 25); // Discord max 25 options

    await interaction.respond(
      filtered.map(name => ({ name, value: name }))
    );
  },

  // ----------------------------
  // EXECUTE COMMAND
  // ----------------------------
  async execute(interaction) {
    const eventName = interaction.options.getString("event");
    const eventId = eventName.toLowerCase().replace(/\s+/g, "_");
    const event = getEvent(eventId);

    if (!event) {
      return interaction.reply({
        content: `❌ Event "${eventName}" not found or already finished.`,
        ephemeral: true
      });
    }

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

    // Display participants grouped by squad
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

    await interaction.reply({ embeds: [embed] });
  }
};
