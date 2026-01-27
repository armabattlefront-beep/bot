const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getEvent } = require("../database/events");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("viewevent")
    .setDescription("View event details")
    .addStringOption(opt =>
      opt.setName("event")
         .setDescription("Event name")
         .setRequired(true)
         .setAutocomplete(true)
    ),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused();
    const events = Object.values(require("../database/events").getAllEvents());
    const filtered = events
      .map(ev => ev.name)
      .filter(name => name.toLowerCase().includes(focused.toLowerCase()));
    await interaction.respond(filtered.map(name => ({ name, value: name })));
  },

  async execute(interaction) {
    const eventName = interaction.options.getString("event");
    const eventId = eventName.toLowerCase().replace(/\s+/g, "_");
    const event = getEvent(eventId);

    if (!event) return interaction.reply({ content: `❌ Event "${eventName}" not found.`, ephemeral: true });

    const embed = new EmbedBuilder()
      .setTitle(`🗂️ Event: ${event.name}`)
      .addFields(
        { name: "Max Players", value: `${event.maxPlayers}`, inline: true },
        { name: "Group Size", value: `${event.groupSize}`, inline: true },
        { name: "Current Participants", value: event.participants.length.toString(), inline: true }
      )
      .setColor(0x1abc9c)
      .setTimestamp();

    if (event.participants.length > 0) {
      const grouped = {};
      for (const p of event.participants) {
        if (!grouped[p.group]) grouped[p.group] = [];
        grouped[p.group].push(`<@${p.id}>`);
      }

      for (const [group, members] of Object.entries(grouped)) {
        embed.addFields({ name: `Squad ${group || "Unassigned"}`, value: members.join("\n"), inline: true });
      }
    }

    interaction.reply({ embeds: [embed] });
  }
};
