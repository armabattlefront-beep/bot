const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getEvent, saveEvent } = require("../database/events");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("editevent")
    .setDescription("Edit an existing event")
    // Required first
    .addStringOption(opt =>
      opt.setName("event")
         .setDescription("Event name to edit")
         .setRequired(true)
    )
    // Optional after required
    .addIntegerOption(opt =>
      opt.setName("maxplayers")
         .setDescription("Set maximum number of participants")
         .setRequired(false)
    )
    .addIntegerOption(opt =>
      opt.setName("groupsize")
         .setDescription("Set squad size for this event")
         .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName("description")
         .setDescription("Update event description")
         .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName("date")
         .setDescription("Update event date")
         .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName("time")
         .setDescription("Update event time")
         .setRequired(false)
    ),

  async execute(interaction) {
    const eventName = interaction.options.getString("event");
    const eventId = eventName.toLowerCase().replace(/\s+/g, "_");
    const event = getEvent(eventId);

    if (!event) return interaction.reply({ content: `❌ Event "${eventName}" not found.`, ephemeral: true });

    const maxPlayers = interaction.options.getInteger("maxplayers");
    const groupSize = interaction.options.getInteger("groupsize");
    const description = interaction.options.getString("description");
    const date = interaction.options.getString("date");
    const time = interaction.options.getString("time");

    if (maxPlayers) event.maxPlayers = maxPlayers;
    if (groupSize) event.groupSize = groupSize;
    if (description) event.description = description;
    if (date) event.date = date;
    if (time) event.time = time;

    saveEvent(eventId, event);

    const embed = new EmbedBuilder()
      .setTitle(`✏️ Event Updated: ${event.name}`)
      .addFields(
        { name: "Max Players", value: `${event.maxPlayers}`, inline: true },
        { name: "Group Size", value: `${event.groupSize || "N/A"}`, inline: true },
        { name: "Date", value: `${event.date}`, inline: true },
        { name: "Time", value: `${event.time}`, inline: true }
      )
      .setDescription(event.description)
      .setColor(0xffd700)
      .setTimestamp();

    interaction.reply({ embeds: [embed] });
  }
};
